public static class Util
{
    public static string GetLastFolderName(string path)
    {
        path = path.Replace("/", "\\");
        if(File.Exists(path) )    
            path = path.Remove(path.LastIndexOf("\\") );

        return path.Remove(0, path.LastIndexOf("\\") + 1);
    }
}