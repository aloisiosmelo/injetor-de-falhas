'use server'

const { execSync } = require('child_process');
const fs = require('fs');
var LOG_ID = undefined

const saveLogToFrontend = async (logId, content) => {

    const filePath = `src/app/outputLogs/${logId}.json`;
    const data = fs.readFileSync(filePath, 'utf8');

    if (data) {
        let dataJson = JSON.parse(data);
        let newContent = dataJson.concat(content);

        fs.writeFileSync(filePath, JSON.stringify(newContent, null, 2), 'utf8');
    }
}

const runCommand = (command) => {
    logMessage(`Command executed: ${command}.`, 'INFO', 'COMMAND_EXECUTION')
    try {
        const output = execSync(command, { encoding: 'utf-8' }).trim();
        logMessage(`Command executed.`, 'INFO', 'COMMAND_EXECUTION')
        return output;
    } catch (error) {
        logMessage(`Fail to execute command. Details: Command executed: ${command}.`, 'ERROR', 'COMMAND_EXECUTION')
        logMessage(`Fail to execute command. Details: Console output: ${error.message}.`, 'ERROR', 'COMMAND_EXECUTION')
        logMessage(`Fail to execute command. Details: Console output: ${error.stdout.toString()}.`, 'ERROR', 'COMMAND_EXECUTION')
        logMessage(`Fail to execute command. Details: Console output: ${JSON.stringify(error)}.`, 'ERROR', 'COMMAND_EXECUTION')
        return null;
    }
};

const logMessage = (message, type = 'INFO', context = '') => {

    if (type === 'ERROR') {
        console.error(`[error][${context}]: ${message}`)
    } else {
        console.log(`[info][${context}]: ${message}`)
    }

    try {
        fs.appendFileSync('HardwareFailure.log', message + '\n', 'utf8');
        if (LOG_ID) {
            saveLogToFrontend(LOG_ID, { message: message })
        }
    } catch (error) {
        console.error(`[erro][logMessage]: Erro ao gravar no log: ${message}`);
        console.error(`[erro][logMessage]: Detalhes: ${JSON.stringify(error)}`);
    }
};

export const faultInjectionHw = async (ip,
    sshPassword,
    sshUsername,
    logId) => {

    LOG_ID = logId;

    try {

        logMessage("Fault injection script has been started.", 'INFO', 'SCRIPT_START')
        const startTime = runCommand("date '+# Start %b %d %H:%M:%S'");
        if (startTime) logMessage(startTime);

        let C1 = 0;

        while (C1 < 50) {
            C1++;

            let TIME = runCommand("Rscript src/app/faultScripts/expFailHW.r");
            let TIMER = runCommand("Rscript src/app/faultScripts/expRepairHW.r");

            if (!TIME || !TIMER) {
                logMessage(`(${C1}) Invalid time. Details: TIME=${TIME} TIMER=${TIMER}`, 'ERROR', 'TIMER_GEN')
                continue;
            }

            TIME = parseFloat(TIME.split(/\s+/).pop());
            TIMER = parseInt(TIMER.split(/\s+/).pop(), 10);

            if (isNaN(TIME) || isNaN(TIMER)) {
                logMessage(`(${C1}) Invalid time. Details: TIME=${TIME} TIMER=${TIMER}`, 'ERROR', 'TIMER_GEN_PARSE');
                continue;
            }

            while (TIMER < 20) {
                logMessage(`(${C1}) Time less than 20. Recalculating now.`, 'INFO', 'TIMER_GEN');
                TIMER = runCommand("Rscript src/app/faultScripts/expRepairHW.r");
                if (!TIMER) break;
                TIMER = parseInt(TIMER.split(/\s+/).pop(), 10);
            }

            logMessage(`(${C1}) Time to failure: ${TIME}.`, 'INFO', 'TIMER_GENERATED');
            logMessage(`(${C1}) Time to repair: ${TIMER}.`, 'INFO', 'TIMER_GENERATED');

            logMessage(`(${C1}) Waiting for fault time.`, 'INFO', 'WAIT_FAULT_TIME');
            await new Promise(resolve => setTimeout(resolve, TIME * 1000));
            
            logMessage(`(${C1}) Fault injected.`, 'INFO', 'FAULT_INJECTED');

            const faultTime = runCommand("date '+%b %d %H:%M:%S'");
            if (faultTime) logMessage(`(${C1}) Fault ${TIME} ${faultTime}`, 'INFO', 'LOG_EVENT');

            const sshCommand = `sshpass -p '${sshPassword}' ssh -tt ${sshUsername}@${ip} -o StrictHostKeyChecking=no PasswordAuthentication=yes "echo '${sshPassword}' | sudo -S rtcwake -m mem -s ${TIMER}"`;
            const sshResult = runCommand(sshCommand);

            if (sshResult === null) {
                logMessage(`(${C1}) Fail to estabilish ssh connection commands.`, 'ERROR', 'SSH_CONNECTION')
            }

            const repairTime = runCommand("date '+%b %d %H:%M:%S'");
            if (repairTime) logMessage(`(${C1}) RepairHardware ${TIMER} ${repairTime}`, 'INFO', 'LOG_EVENT');

            logMessage(`(${C1}) Repair injected.`, 'INFO', 'REPAIR_INJECTED');
        }

        const endTime = runCommand("date '+End %b %d %H:%M:%S'");
        if (endTime) logMessage(endTime);

        logMessage(`(${C1}) Finished script.`, 'INFO', 'FINISHED_SCRIPT');
    } catch (error) {
        logMessage(`(${C1}) An unexpected error occurred. Details: ${JSON.stringify(error)}.`, 'ERROR', 'UNEXPECTED_ERROR')
    }
};