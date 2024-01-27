using System.Net;
using WebConnector;

internal static class Handler
{
    private static string[] validContexts = {"", "login", "export", "exit"};
    internal static void OnRequestIncome(HttpListenerContext context)
    {
        var contextUri = context.Request.Url;
        var response = context.Response;
        if(contextUri == null)
        {
            Program.PrintLine("Não foi possível prosseguir com o tratamento de uma requisição. 'URI' é nulo.");
            response.StatusCode = (int) HttpStatusCode.ExpectationFailed;
            response.Close();
            return;
        }

        string file = Program.clientFilesPath + contextUri.LocalPath.Replace("/", "\\");

        if(File.Exists(file) == false)
        {
            if(validContexts.Contains(Util.GetLastFolderName(file) ) )
            {
                HandleNoFileContext(context);
                return;
            }
            response.StatusCode = (int) HttpStatusCode.NotFound;
            response.Close();
            return;
        }
        
        //Program.PrintLine(file);     

        RespondRequest(context, File.ReadAllBytes(file) );
    }

    internal static void HandleNoFileContext(HttpListenerContext context)
    {
        var contextUri = context.Request.Url;
        var response = context.Response;
        if(contextUri == null)
        {
            Program.PrintLine("Não foi possível prosseguir com o tratamento de uma requisição. 'URI' é nulo.");
            response.StatusCode = (int) HttpStatusCode.ExpectationFailed;
            response.Close();
            return;
        }

        string file = Program.clientFilesPath + contextUri.LocalPath.Replace("/", "\\");

        if(Util.GetLastFolderName(file) == validContexts[0] )
        {
            if(!Connector.IsLoggedIn())
                file = Program.clientFilesPath + "\\index.html";
            else file = Program.clientFilesPath + "\\pages\\index.html";

            RespondRequest(context, File.ReadAllBytes(file) );
            return;
        }

        try
        {
            switch(Util.GetLastFolderName(file) )
            {
                case "login":{
                    Connector.RespondLoginContext(context);
                    return;
                }
                case "exit":{
                    Connector.RespondCloseServerContext(context);
                    return;
                }
                case "export":{
                    Connector.RespondGridRequestContext(context);
                    return;
                }
                default:{
                    if(ConnectionAlreadyClosed(context) )
                        return;
            
                    context.Response.StatusCode = (int) HttpStatusCode.NotFound;
                    context.Response.Close();
                    break;
                }
            }
        }
        catch(Exception e)
        {
            Program.PrintLine($"Ocorreu a seguinte exceção: {e}");
            if(ConnectionAlreadyClosed(context) )
                return;
            
            context.Response.StatusCode = (int) HttpStatusCode.NotFound;
            context.Response.Close();
        }
    }

    internal static void RespondRequest(HttpListenerContext context, byte[] resultToSend)
    {
        var response = context.Response;

        response.ContentLength64 = resultToSend.Length;
        response.OutputStream.Write(resultToSend, 0, resultToSend.Length);

        response.Close();
    }

    internal static bool ConnectionAlreadyClosed(HttpListenerContext context)
    {
        try
        {
            return !context.Response.OutputStream.CanWrite;
        }
        catch(ObjectDisposedException)
        {
            return true;
        }
    } 
}