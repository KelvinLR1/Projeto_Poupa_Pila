using System;
using System.Diagnostics;
using System.ServiceProcess;
using System.IO;

namespace PoupaPilaService
{
    public class PoupaPilaService : ServiceBase
    {
        private Process nodeProcess;

        public static void Main()
        {
            ServiceBase.Run(new PoupaPilaService());
        }

        public PoupaPilaService()
        {
            this.ServiceName = "PoupaPila";
        }

        protected override void OnStart(string[] args)
        {
            string appDir = AppDomain.CurrentDomain.BaseDirectory;
            string nodePath = Path.Combine(appDir, "node.exe");
            string serverPath = Path.Combine(appDir, @"backend\server.js");
            string workingDir = Path.Combine(appDir, "backend");

            // Configurar log de auditoria simples
            string logPath = Path.Combine(appDir, "service_log.txt");
            File.AppendAllText(logPath, "[INFO] Servico iniciando as " + DateTime.Now.ToString() + "...\r\n");

            if (!File.Exists(nodePath))
            {
                File.AppendAllText(logPath, "[ERRO] node.exe nao encontrado em: " + nodePath + "\r\n");
                throw new FileNotFoundException("node.exe nao encontrado", nodePath);
            }

            if (!File.Exists(serverPath))
            {
                File.AppendAllText(logPath, "[ERRO] server.js nao encontrado em: " + serverPath + "\r\n");
                throw new FileNotFoundException("server.js nao encontrado", serverPath);
            }

            nodeProcess = new Process();
            nodeProcess.StartInfo.FileName = nodePath;
            nodeProcess.StartInfo.Arguments = "\"" + serverPath + "\"";
            nodeProcess.StartInfo.WorkingDirectory = workingDir;
            nodeProcess.StartInfo.CreateNoWindow = true;
            nodeProcess.StartInfo.UseShellExecute = false;

            // Variável de ambiente para indicar produção
            nodeProcess.StartInfo.EnvironmentVariables["NODE_ENV"] = "production";

            try
            {
                nodeProcess.Start();
                File.AppendAllText(logPath, "[INFO] Processo Node.js iniciado com PID: " + nodeProcess.Id.ToString() + "\r\n");
            }
            catch (Exception ex)
            {
                File.AppendAllText(logPath, "[ERRO] Falha ao iniciar processo Node.js: " + ex.Message + "\r\n");
                throw;
            }
        }

        protected override void OnStop()
        {
            string appDir = AppDomain.CurrentDomain.BaseDirectory;
            string logPath = Path.Combine(appDir, "service_log.txt");
            File.AppendAllText(logPath, "[INFO] Servico parando as " + DateTime.Now.ToString() + "...\r\n");

            if (nodeProcess != null && !nodeProcess.HasExited)
            {
                try
                {
                    nodeProcess.Kill();
                    nodeProcess.WaitForExit(5000);
                    File.AppendAllText(logPath, "[INFO] Processo Node.js encerrado com sucesso.\r\n");
                }
                catch (Exception ex)
                {
                    File.AppendAllText(logPath, "[ERRO] Erro ao encerrar processo Node.js: " + ex.Message + "\r\n");
                }
            }
        }
    }
}
