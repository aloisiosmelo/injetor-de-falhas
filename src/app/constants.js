const LABELS_EN = {
    app_title: 'Fault and Repair Injection App',
    form_ip: 'IP',
    form_ssh_username: 'SSH Username',
    form_ssh_password: 'SSH Password',
    form_autodetect_network_interface: 'Autodetect network interface',
    form_network_interface_id: 'Network interface identifier',
    form_injection_type: 'Injection Type',
    form_time_to_failure: 'TTF',
    form_time_to_repair: 'TTR',
    form_experiment_attempts: 'Experiment Attempts',
    form_attempts: 'attempts',
    form_download_log: 'Download Log',
    form_inject: 'Inject',
    form_yes: 'Yes',
    form_no: 'No',
}

const LABELS_PT_BR = {
    app_title: 'Aplicativo de injeção de falhas e reparos',
    form_ip: 'IP',
    form_ssh_username: 'Usuário SSH',
    form_ssh_password: 'Senha SSH',
    form_autodetect_network_interface: 'Auto detectar interface de rede',
    form_network_interface_id: 'Identificador da interface de rede',
    form_injection_type: 'Tipo da injeção',
    form_time_to_failure: 'TDF',
    form_time_to_repair: 'TDR',
    form_experiment_attempts: 'Tentativas do Experimento',
    form_attempts: 'tentativas',
    form_download_log: 'Baixar registro de eventos',
    form_inject: 'Injetar',
    form_yes: 'Sim',
    form_no: 'Não',
}

export const LABELS = process.env.NEXT_PUBLIC_APP_LANGUAGE == 'pt-br' ? LABELS_PT_BR : LABELS_EN