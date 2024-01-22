using System.Diagnostics;
using System.Net;
using System.Reflection;
using System.Security.Principal;
using WebConnector;

public class Program
{
    private static bool running = true;
    private static bool exitPromptEntered = false;
    public static string clientFilesPath = "";
    public static void Main()
    {   
        var server = new HttpListener();
        server.Prefixes.Add("http://127.0.0.1:9090/");

        var executablePath = Environment.ProcessPath;
        if(executablePath == null)
        {
            Console.WriteLine("Não foi possível encontrar o diretório deste programa.");
            return;
        }

        var parentExeDirectoryInfo = Directory.GetParent(executablePath);
        if(parentExeDirectoryInfo == null)
        {
            Console.WriteLine("Não foi possível encontrar o diretório pai do diretório do executável.");
            return;
        }
        var currentDirectory = parentExeDirectoryInfo.ToString();
        clientFilesPath = currentDirectory;

        
        while(Directory.GetDirectories(clientFilesPath).Any(f => f.Contains("client") ) == false)
        {
            var parentDirectoryInfo = Directory.GetParent(clientFilesPath);
            if(parentDirectoryInfo == null)
            {
                Console.WriteLine("Não foi possível encontrar o diretório que contém os arquivos para a aplicação WEB.");
                return;
            }
            clientFilesPath = parentDirectoryInfo.ToString();
        }
            
            

        clientFilesPath = Directory.GetDirectories(clientFilesPath).First(f => f.Contains("client") );

        //Console.WriteLine(clientFilesPath);

        server.Start();
        OpenBrowser();
        new Thread(new ThreadStart( delegate 
        {
            while(running)
            {
                try
                {
                    var context = server.GetContext();
                    Handler.OnRequestIncome(context);
                }
                catch(Exception e)
                {
                    Console.WriteLine($"Ocorreu o seguinte erro ao receber uma requisição: {e}");
                }   
            }

            server.Stop();
            Console.WriteLine("Servidor desligado com sucesso!");
        } )  ).Start();

        
        var promptsThread = new Thread(new ThreadStart(delegate {
                while(true)
                {
                    Task.Run(delegate
                    {
                        Thread.Sleep(1 * 1000);
                        var prompt = Console.ReadLine();
                        if(prompt == null)
                            return;
                        
                        if(prompt.ToLower().TrimEnd() != "exit")
                            return;
                        
                        exitPromptEntered = true;
                    } ).Wait(3000);
                    
                    if(exitPromptEntered || !IsRunning() )
                        break;
                }
        } ) );
        promptsThread.Start();

        while(exitPromptEntered == false && IsRunning() )
            Thread.Sleep(1 * 1000);

        if(IsRunning() )
        {  
            Console.WriteLine("Uma requisição de desligamento do servidor será enviada...");
            Connector.RequestServerShutdown();
        }
        
        while(server.IsListening)
            Thread.Sleep(1 * 1000);

        Console.WriteLine("Interrompendo programa...");
        return;
    }

    public static void OpenBrowser()
    {
        try
        {
            Process.Start(new ProcessStartInfo{
                FileName = "http://127.0.0.1:9090/",
                UseShellExecute = true
            } );
        }
        catch(Exception e)
        {
            Console.WriteLine($"Houve o seguinte erro ao tentar abrir o navegador: {e}");
        }
    }

    public static bool IsRunning() => running;
    public static void Shutdown() => running = false;
}

