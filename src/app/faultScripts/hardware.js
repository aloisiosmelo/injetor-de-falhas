'use server'

const { execSync } = require('child_process');
const fs = require('fs');
var LOG_ID = undefined

const saveLogToFrontend = async (logId, content) => {

    const caminhoDoArquivo = `src/app/outputLogs/${logId}.json`;
    const data = fs.readFileSync(caminhoDoArquivo, 'utf8');

    if (data) {
        let dataJson = JSON.parse(data);
        let novoConteudo = dataJson.concat(content);

        fs.writeFileSync(caminhoDoArquivo, JSON.stringify(novoConteudo, null, 2), 'utf8');
    }
}

const runCommand = (command) => {
    console.log('command',command)
    try {
        const output = execSync(command, { encoding: 'utf-8' }).trim();
        return output;
    } catch (error) {
        console.error(`Erro ao executar comando: ${command}`);
        console.error(`Detalhes: ${error.message}`);
        console.error("error", error.stdout.toString());
        return null;
    }
};

const logMessage = (message) => {

    try {
        fs.appendFileSync('HardwareFailure.log', message + '\n', 'utf8');
        if (LOG_ID) {
            saveLogToFrontend(LOG_ID, { message: message })
        }
    } catch (error) {
        console.error(`Erro ao gravar no log: ${message}`);
        console.error(`Detalhes: ${error.message}`);
    }
};

export const faultInjectionHw = async (ip,
    injectionType,
    sshPassword,
    sshUsername,
    logId) => {

    LOG_ID = logId;

    try {

        console.log("Running fault injection hardware script...");
        const startTime = runCommand("date '+# Start %b %d %H:%M:%S'");
        if (startTime) logMessage(startTime);

        let C1 = 0;

        while (C1 < 50) {
            C1++;

            // let TIME = runCommand("Rscript expFailHW.r");
            // let TIMER = runCommand("Rscript expRepairHW.r");

            let TIME = runCommand("Rscript src/app/faultScripts/expFailHW.r");
            let TIMER = runCommand("Rscript src/app/faultScripts/expRepairHW.r");

            //src/app/faultScripts/expFailHW.r

            if (!TIME || !TIMER) {
                console.error(`Erro: Não foi possível obter TIME ou TIMER no ciclo ${C1}.`);
                logMessage(`${C1} ERRO: Falha ao obter TIME ou TIMER`);

                continue;
            }

            TIME = parseFloat(TIME.split(/\s+/).pop());
            TIMER = parseInt(TIMER.split(/\s+/).pop(), 10);

            if (isNaN(TIME) || isNaN(TIMER)) {
                console.error(`Erro: Valores inválidos TIME=${TIME} TIMER=${TIMER} no ciclo ${C1}`);
                logMessage(`${C1} ERRO: Valores inválidos TIME=${TIME} TIMER=${TIMER}`);
                continue;
            }

            while (TIMER < 20) {
                console.log("Time less than 20, recalculando...");
                TIMER = runCommand("Rscript expRepairHW.r");
                if (!TIMER) break;
                TIMER = parseInt(TIMER.split(/\s+/).pop(), 10);
            }

            console.log(`Time to failure: ${TIME}`);
            console.log(`Time to repair: ${TIMER}`);

            console.log("Aguardando tempo de falha...");
            // await new Promise(resolve => setTimeout(resolve, TIME * 1000));

            console.log("Fault injected");
            const faultTime = runCommand("date '+%b %d %H:%M:%S'");
            if (faultTime) logMessage(`${C1} Fault ${TIME} ${faultTime}`);

            const sshCommand = `sshpass -p '${sshPassword}' ssh -tt ${sshUsername}@${ip} -o StrictHostKeyChecking=no PasswordAuthentication=yes "echo '${sshPassword}' | sudo -S rtcwake -m mem -s ${TIMER}"`;
            const sshResult = runCommand(sshCommand);
            
            if (sshResult === null) {
                console.error(`Erro ao executar SSH no ciclo ${C1}`);
                logMessage(`${C1} ERRO: Falha no SSH`);
            }

            const repairTime = runCommand("date '+%b %d %H:%M:%S'");
            if (repairTime) logMessage(`${C1} RepairHardware ${TIMER} ${repairTime}`);

            console.log("Repair injected");
        }

        const endTime = runCommand("date '+End %b %d %H:%M:%S'");
        if (endTime) logMessage(endTime);

        console.log("Script finalizado.");
    } catch (error) {
        console.error("Erro inesperado durante a execução do script:");
        console.error(error.message);
    }
};