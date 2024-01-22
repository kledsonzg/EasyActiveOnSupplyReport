using System.Net;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;

namespace WebConnector
{   
    internal static class Connector
    {
        private static string sessionIDCookie = "";
        private static string aspNetCookie = "";
        
        internal static bool IsLoggedIn() => !(string.IsNullOrEmpty(sessionIDCookie) || string.IsNullOrEmpty(aspNetCookie) );
        
        internal static void RequestServerShutdown()
        {
            new Thread(new ThreadStart(delegate {
                try{
                    var client = new HttpClient();

                    client.Send(new HttpRequestMessage(HttpMethod.Get, "http://127.0.0.1:9090/exit") );
                }
                catch(Exception e)
                {
                    Console.WriteLine($"Ocorreu o seguinte erro ao fazer uma requisição para desligar o servidor: {e}");
                    return;
                }

                Console.WriteLine("Requisição HTTP interna de desligamento bem sucedida!");
            } ) ).Start();
        }
        
        internal static void RespondCloseServerContext(HttpListenerContext context)
        {
            
            Program.Shutdown();
            Console.WriteLine("Requisição de desligamento recebida! Desligando servidor...");
            context.Response.Close();
        }

        internal static void RespondGridRequestContext(HttpListenerContext context)
        {
            var contextResponse = context.Response;
            var contextRequest = context.Request;
            if(contextRequest.HttpMethod.ToUpper() != "POST" || !contextRequest.HasEntityBody)
            {
                contextResponse.StatusCode = (int) HttpStatusCode.BadRequest;
                contextResponse.Close();
                return;
            }
            if(string.IsNullOrEmpty(sessionIDCookie) || string.IsNullOrEmpty(aspNetCookie) )
            {
                contextResponse.StatusCode = (int) HttpStatusCode.Unauthorized;
                contextResponse.Close();
                return;
            }

            var requestBody = new StreamReader(contextRequest.InputStream, Encoding.UTF8).ReadToEnd();
            var client = new HttpClient();
            var request = new HttpRequestMessage(HttpMethod.Post, Urls.FISCALNOTES_URL);

            var cookies = new List<string>
            {
                sessionIDCookie,
                aspNetCookie
            };
            request.Headers.Add("Cookie", cookies);

            request.Content = new StringContent(requestBody, Encoding.UTF8, "application/json");

            var response = client.Send(request);
            var result = response.Content.ReadAsStringAsync().Result;
            var htmlString = $"<html>\n<body>\n{result}\n</body>\n</html>";
            var document = new HtmlAgilityPack.HtmlDocument();
            document.LoadHtml(htmlString);
            
            var fiscalCodesVar = document.DocumentNode.DescendantsAndSelf().
                FirstOrDefault(e => e != null && e.Name.ToLower() == "script" && e.InnerHtml.Contains("listNotaFiscal_IDs"), null);
            
            // Se não a tag script não for encontrada, ou a array 'listNotaFiscal_IDs' estiver vazia, a conexão é finalizada.
            if(fiscalCodesVar == null || fiscalCodesVar.InnerHtml.LastIndexOf('[') == fiscalCodesVar.InnerHtml.LastIndexOf(']') - 1)
            {
                contextResponse.Close();
                return;
            }

            // Baseada na contagem de vírgulas dentro da array, é possível saber quantos elementos a array tem.
            var fiscalCodesCount = fiscalCodesVar.InnerHtml.Count(s => s == ',') + 1;
            requestBody = GetFixedPostContentStringByFiscalCodesCount(fiscalCodesCount, requestBody);

            request = new HttpRequestMessage(HttpMethod.Post, Urls.FISCALNOTES_URL);
            request.Headers.Add("Cookie", cookies);
            request.Content = new StringContent(requestBody, Encoding.UTF8, "application/json");
            Console.WriteLine($"Contagem de NF's: {fiscalCodesCount}");
            response = client.Send(request);

            Console.WriteLine($"Requisição de resultado enviado com o(s) corpo/filtro(s): {requestBody}");
            var resultContent = new StringContent($"<html><body>{response.Content.ReadAsStringAsync().Result}</body></html>");
            Handler.RespondRequest(context, resultContent.ReadAsByteArrayAsync().Result);
        }
        
        internal static void RespondLoginContext(HttpListenerContext context)
        {          
            var contextUri = context.Request.Url;
            var contextResponse = context.Response;
            if(contextUri == null)
            {
                Console.WriteLine("Não foi possível prosseguir com a requisição de login. 'URI' é nulo.");
                contextResponse.StatusCode = (int) HttpStatusCode.ExpectationFailed;
                contextResponse.Close();
                return;
            }
            var query = contextUri.Query.Replace("?", "");

            var user = query.Remove(0, query.IndexOf('=') + 1);
            user = user.Remove(user.IndexOf('&') );
            var password = query.Remove(0, query.LastIndexOf('=') + 1);

            var client = new HttpClient();
            var request = new HttpRequestMessage(HttpMethod.Post, Urls.LOGIN_URLS[0] );
            var parameters = new Dictionary<string, string>();

            parameters["user"] = user;
            parameters["password"]= password;
            request.Content = new FormUrlEncodedContent(parameters);
            
            var response = client.Send(request);
            var result = response.Content.ReadAsStringAsync().Result;

            try{
                var json = JsonDocument.Parse(result).RootElement;
                if(!json.GetProperty("Success").GetBoolean() )
                {
                    contextResponse.StatusCode = (int) HttpStatusCode.Unauthorized;
                    contextResponse.Close();
                    return;
                }
            }
            catch(Exception e)
            {
                Console.WriteLine($"Ocorreu a seguinte exceção: {e}");
                contextResponse.StatusCode = (int) HttpStatusCode.NotFound;
                contextResponse.Close();
                return;
            }
            
            var sessionID = response.Headers.GetValues("Set-Cookie").ToList().First(cookie => cookie.Contains("sessionID") );
            //Console.WriteLine("sessionID: " + sessionID);
            var username = GetUser(sessionID);
            var companyID = GetCompanyID(sessionID);

            Console.WriteLine($"Logado(a) como '{username}'!");

            client = new HttpClient();
            request = new HttpRequestMessage(HttpMethod.Post, Urls.LOGIN_URLS[1] );
            parameters = new Dictionary<string, string>();

            parameters["_user"] = user;
            parameters["_code"] = password;
            parameters["_company"] = companyID;
            parameters["_filial"] = "";
            parameters["_type"] = "D";
            parameters["_isDestinatario"] = "true";
            parameters["company"] = companyID;
            parameters["company-filial"] = "";
            request.Content = new FormUrlEncodedContent(parameters);
            request.Headers.Add("Cookie", sessionID);

            response = client.Send(request);
            var aspNet = response.Headers.GetValues("Set-Cookie").ToList().FirstOrDefault(cookie => cookie.Contains(".AspNet.ApplicationCookie"), "");
            if(aspNet == "")
            {
                Console.WriteLine($"Ocorreu algum erro ao tentar fazer o login.");
                contextResponse.StatusCode = (int) HttpStatusCode.NotFound;
                contextResponse.Close();
                return;
            }

            sessionIDCookie = sessionID;
            aspNetCookie = aspNet;

            contextResponse.StatusCode = (int) HttpStatusCode.OK;
            contextResponse.Close();
        }

        // Serve para obter o ID da empresa no site. Necessário obter para fazer a requisição de login para obter o cookie '.AspNet.ApplicationCookie'.
        private static string GetCompanyID(string sessionID)
        {
            string? toReturn = "";
            var client = new HttpClient();
            var request = new HttpRequestMessage(HttpMethod.Get, Urls.COMPANYINFO_URL);

            request.Headers.Add("Cookie", sessionID);
            var response = client.Send(request);

            // Apesar do formato da string de retorno da requisição ser em formato JSON, a string possui aspas duplas no ínicio e no fim.
            // E por isso é necessário removê-los antes de tratá-lo como um objeto JsonDocument, ou então haverá erros ao fazer o 'Parsing'.
            var result = response.Content.ReadAsStringAsync().Result.Replace("[", "").Replace("]", "").Replace("\\", "").Remove(0, 1);
            result = result.Remove(result.LastIndexOf('"'), 1);

            try{
                var json = JsonDocument.Parse(result).RootElement;
                toReturn = json.GetProperty("Cliente_ID").GetInt32().ToString();
                if(toReturn == null)
                    return "";
                return toReturn;
            }
            catch(Exception e){
                Console.WriteLine($"Ocorreu a seguinte exceção: {e}");
                return "";
            }
        }

        // Método não relevante para fazer o login. Serve apenas para obter o nome do usuário.
        private static string GetUser(string sessionID)
        {
            var client = new HttpClient();
            var request = new HttpRequestMessage(HttpMethod.Get, Urls.NAME_URL);

            request.Headers.Add("Cookie", sessionID);
            var response = client.Send(request);
            var result = response.Content.ReadAsStringAsync().Result.Replace("\"", "");

            return result;
        }

        // A(s) propriedade(s) 'Top' na string em formato JSON tem seu valor alterado pela contagem de elementos encontrada anteriormente na array.
        private static string GetFixedPostContentStringByFiscalCodesCount(int fiscalCodesCount, string content)
        {
            var rangeStringIndex = -1;
            var rangeStringDeclaration = "\"Top\":\"";
            
            while(content.IndexOf(rangeStringDeclaration, rangeStringIndex + 1) != -1)
            {
                
                var value = $"{rangeStringDeclaration}{fiscalCodesCount}\"";
                var startIndex = content.IndexOf(rangeStringDeclaration, rangeStringIndex + 1);
                var endIndex = content.IndexOf('"', startIndex + rangeStringDeclaration.Length);

                content = content.Remove(startIndex, (endIndex - startIndex) + 1);
                content = content.Insert(startIndex, value);
                rangeStringIndex = startIndex + value.Length;
            }
            return content;
        }
    }
}