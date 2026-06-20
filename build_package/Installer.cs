using System;
using System.IO;
using System.Diagnostics;
using System.IO.Compression;

namespace PoupaPilaInstaller
{
    class Program
    {
        static void Main(string[] args)
        {
            try
            {
                Console.Title = "Instalador Poupa Pila";
                Console.WriteLine("=========================================================");
                Console.WriteLine(" Instalador Poupa Pila - Controle Financeiro");
                Console.WriteLine("=========================================================");
                Console.WriteLine();

                string selfPath = System.Reflection.Assembly.GetExecutingAssembly().Location;
                string tempExtractDir = Path.Combine(Path.GetTempPath(), "PoupaPilaInstall_" + Path.GetRandomFileName());
                Directory.CreateDirectory(tempExtractDir);

                Console.WriteLine("Extraindo arquivos de instalacao...");
                
                using (ZipArchive archive = ZipFile.OpenRead(selfPath))
                {
                    foreach (ZipArchiveEntry entry in archive.Entries)
                    {
                        string destinationPath = Path.Combine(tempExtractDir, entry.FullName);
                        string dir = Path.GetDirectoryName(destinationPath);
                        if (!Directory.Exists(dir))
                        {
                            Directory.CreateDirectory(dir);
                        }
                        
                        if (!string.IsNullOrEmpty(entry.Name))
                        {
                            entry.ExtractToFile(destinationPath, true);
                        }
                    }
                }

                Console.WriteLine("Iniciando instalador com privilegios de Administrador...");
                
                ProcessStartInfo psi = new ProcessStartInfo();
                psi.FileName = "cmd.exe";
                psi.Arguments = "/c install.bat";
                psi.WorkingDirectory = tempExtractDir;
                psi.UseShellExecute = true;
                psi.Verb = "runas"; // Solicita privilégios de administrador

                try
                {
                    Process proc = Process.Start(psi);
                    proc.WaitForExit();
                }
                catch (Exception ex)
                {
                    Console.WriteLine("\n[ERRO] O instalador foi cancelado ou nao obteve permissao de Administrador.");
                    Console.WriteLine("Mensagem: " + ex.Message);
                    Console.WriteLine("\nPressione qualquer tecla para sair...");
                    Console.ReadKey();
                    return;
                }

                // Tenta limpar arquivos temporários em segundo plano
                try
                {
                    Directory.Delete(tempExtractDir, true);
                }
                catch {}
            }
            catch (Exception ex)
            {
                Console.WriteLine("\nErro durante a instalacao: " + ex.Message);
                Console.WriteLine("Pressione qualquer tecla para sair...");
                Console.ReadKey();
            }
        }
    }
}
