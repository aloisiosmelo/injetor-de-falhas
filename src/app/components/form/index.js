"use client";
import React, { useState } from 'react';
import injectorLogo from '../../../../public/fault_injector_logo.png'
import Image from 'next/image';
import Loading from '../loading';
import * as moment from 'moment'
import CsvDownloadButton from 'react-json-to-csv'

const Form = () => {

    const [ip, setIp] = useState('');
    const [sshUsername, setSshUsername] = useState('');
    const [sshPassword, setSshPassword] = useState('');
    const [networkInterfaceId, setNetworkInterfaceId] = useState('');
    const [autoDetectNetworkInterfaceId, setAutoDetectNetworkInterfaceId] = useState(true);
    const [injectionType, setInjectionType] = useState('Hardware');
    const [timeToFail, setTimeToFail] = useState('');
    const [timeToRepair, setTimeToRepair] = useState('');
    const [experimentAttempts, setExperimentAttempts] = useState('');
    const [logQueueTTF, setLogQueueTTF] = useState([]);
    const [logQueueTTR, setLogQueueTTR] = useState([]);

    const [showError, setShowError] = useState(false);
    const [showErrorText, setShowErrorText] = useState('');

    const [loading, setLoading] = useState(false);

    const delay = millis => new Promise((resolve, reject) => {
        setTimeout(_ => resolve(), millis)
    });

    const isEmpty = (str) => (str === '' || str == undefined || str == null) ? true : false;

    const generateHour = () => {
        return `${moment().format('hh:mm:ss')}`;
    }

    const showErrorMsg = (msg) => {
        setShowError(true);
        setShowErrorText(msg);

        setTimeout(() => {
            setShowError(false);
            setShowErrorText('');
        }, 5000);
    }

    const pingServer = async (ip, setLogCallback) => await fetch(`${process.env.NEXT_PUBLIC_PING_API_ROUTE}${ip}`, {
        method: "GET",
        'Access-Control-Allow-Origin': '*'
    }).then((resp) => resp.json()).then((data) => data?.server_status === true ? setLogCallback(prevArray => [...prevArray, generateHour() + ' - up. ']) : setLogCallback(prevArray => [...prevArray, generateHour() + ' - down. ']))

    const handleOnSubmit = async () => {
        if (isEmpty(ip) || isEmpty(sshUsername) || isEmpty(sshPassword)
            || isEmpty(autoDetectNetworkInterfaceId) || isEmpty(injectionType) || isEmpty(timeToFail)
            || isEmpty(timeToRepair) || isEmpty(experimentAttempts)) {
            showErrorMsg('All fields required.');
        } else {
            setLoading(true);
            try {
                const response = await fetch(process.env.NEXT_PUBLIC_INJECTOR_API_ROUTE, {
                    method: "POST",
                    body: JSON.stringify({
                        ip,
                        sshPassword,
                        sshUsername,
                        experimentAttempts,
                        timeToFail,
                        timeToRepair,
                        autoDetectNetworkInterfaceId,
                        networkInterfaceId,
                        injectionType,
                    }),
                    headers: {
                        "Content-Type": "application/json",
                        'Access-Control-Allow-Origin': '*'
                    },
                })

                const { data } = await response.json()

                if (data?.status === "error") {
                    setLoading(false);
                    return showErrorMsg(data.error);
                }

                if (data?.time_to_fail) {
                    setLogQueueTTF(prevArray => [...prevArray, 'Time to fail']);
                    setLogQueueTTF(prevArray => [...prevArray, moment(data?.time_to_fail).format('DD-MM-YYYY - hh:mm:ss')]);
                    setLogQueueTTF(prevArray => [...prevArray, 'Waiting to start']);

                    await delay(moment(data?.time_to_fail).format('ss') * 1000);
                    setLogQueueTTF(prevArray => [...prevArray, 'Time to fail Schedule Started']);

                    setInterval(() => {
                        pingServer(ip, setLogQueueTTF);
                    }, 5000);
                }

                if (data?.time_to_repair) {
                    setLogQueueTTR(prevArray => [...prevArray, 'Time to repair']);
                    setLogQueueTTR(prevArray => [...prevArray, moment(data?.time_to_repair).format('DD-MM-YYYY - hh:mm:ss')]);
                    setLogQueueTTR(prevArray => [...prevArray, 'Waiting to start']);

                    await delay(moment(data?.time_to_repair).format('ss') * 1000);
                    setLogQueueTTR(prevArray => [...prevArray, 'Time to fail Schedule Started']);

                    setInterval(() => {
                        pingServer(ip, setLogQueueTTR);
                    }, 5000);
                }

            } catch (error) {
                console.log(error)
                setLoading(false);
                return showErrorMsg("Unable to complete request");
            }

        }
    }

    return (
        <div className="bg-gray-100 p-0 sm:p-12">
            <div className="mx-auto max-w-md px-6 py-12 bg-white border-0 shadow-lg sm:rounded-3xl mb-2">
                <div className="flex flex-row mx-0 mb-4">
                    <Image
                        src={injectorLogo}
                        width={80}
                        height={80}
                        alt="Fault Injector App Logo"
                    />
                    <h1 className="text-2xl font-bold mb-8 text-center mt-4">Fault Injector App</h1>
                </div>

                {showError &&
                    (<div className="bg-red-300 min-h-2 my-4 p-4 rounded-lg transition-all duration-150 ease-linear">
                        {showErrorText}
                    </div>)}

                {logQueueTTF && logQueueTTF.length > 0 &&
                    (<div className="bg-black text-white min-h-2 my-4 p-4 rounded-lg transition-all duration-150 ease-linear flex flex-col h-full max-h-48 overflow-y-auto overflow-anchor-auto">
                        {logQueueTTF.map((log, index) => <small key={index}> {log} </small>)}
                    </div>)}

                {logQueueTTR && logQueueTTR.length > 0 &&
                    (<div className="bg-black text-white min-h-2 my-4 p-4 rounded-lg transition-all duration-150 ease-linear flex flex-col h-full max-h-48 overflow-y-auto overflow-anchor-auto">
                        {logQueueTTR.map((log, index) => <small key={index}> {log} </small>)}
                    </div>)}

                {logQueueTTR && logQueueTTR.length > 0 && logQueueTTF && logQueueTTF.length > 0 && (
                    <div className="flex flex-row mx-0 mb-4">
                        <CsvDownloadButton
                            data={[logQueueTTR, logQueueTTF]}
                            filename="ttr_log.csv"
                            className="w-full px-6 py-3 mt-3 text-lg text-white transition-all duration-150 ease-linear rounded-lg shadow outline-none bg-neutral-400 hover:bg-neutral-600 hover:shadow-lg focus:outline-none">
                            Download Log
                        </CsvDownloadButton>
                    </div>
                )}

                {logQueueTTF.length === 0 && logQueueTTR.length === 0 && (<form id="form" noValidate className="bg-gray-100 p-4 rounded-lg">
                    <div className="relative z-0 w-full mb-5">
                        <input
                            type="text"
                            name="ip"
                            id="ip"
                            placeholder=" "
                            required
                            value={ip}
                            onChange={e => setIp(e.target.value)}
                            className="pt-3 pb-2 block w-full px-0 mt-0 bg-transparent border-0 border-b-2 appearance-none focus:outline-none focus:ring-0 focus:border-black border-gray-200"
                        />
                        <label htmlFor="name" className="absolute duration-300 top-3 -z-1 origin-0 text-gray-500">IP</label>
                        <span className="text-sm text-red-600 hidden" id="error">IP is required</span>
                    </div>

                    <div className="relative z-0 w-full mb-5">
                        <input
                            required
                            value={sshUsername}
                            onChange={e => setSshUsername(e.target.value)}
                            type="text"
                            name="sshUsername"
                            id="sshUsername"
                            placeholder=" "
                            className="pt-3 pb-2 block w-full px-0 mt-0 bg-transparent border-0 border-b-2 appearance-none focus:outline-none focus:ring-0 focus:border-black border-gray-200"
                        />
                        <label htmlFor="sshUsername" className="absolute duration-300 top-3 -z-1 origin-0 text-gray-500">SSH Username</label>
                        <span className="text-sm text-red-600 hidden" id="error">SSH Username is required</span>
                    </div>

                    <div className="relative z-0 w-full mb-5">
                        <input
                            value={sshPassword}
                            onChange={e => setSshPassword(e.target.value)}
                            type="password"
                            name="sshPassword"
                            placeholder=" "
                            className="pt-3 pb-2 block w-full px-0 mt-0 bg-transparent border-0 border-b-2 appearance-none focus:outline-none focus:ring-0 focus:border-black border-gray-200"
                        />
                        <label htmlFor="sshPassword" className="absolute duration-300 top-3 -z-1 origin-0 text-gray-500">Enter SSH Password</label>
                        <span className="text-sm text-red-600 hidden" id="error">SSH Password is required</span>
                    </div>

                    <fieldset className="relative z-0 w-full p-px mb-5">
                        <legend className="absolute text-gray-500 transform scale-75 -top-3 origin-0">Autodetect network interface</legend>
                        <div className="block pt-3 pb-2 space-x-4">
                            <label>
                                <input
                                    type="radio"
                                    name="autoDetectNetworkInterfaceId"
                                    onChange={() => setAutoDetectNetworkInterfaceId(true)}
                                    defaultValue={true}
                                    defaultChecked={autoDetectNetworkInterfaceId}
                                    className="mr-2 text-black border-2 border-gray-300 focus:border-gray-300 focus:ring-black"
                                />
                                Yes
                            </label>
                            <label>
                                <input
                                    type="radio"
                                    name="autoDetectNetworkInterfaceId"
                                    onChange={() => setAutoDetectNetworkInterfaceId(false)}
                                    defaultValue={false}
                                    className="mr-2 text-black border-2 border-gray-300 focus:border-gray-300 focus:ring-black"
                                />
                                No
                            </label>
                        </div>
                        <span className="text-sm text-red-600 hidden" id="error">Autodetect network interface has to be selected</span>
                    </fieldset>

                    {!autoDetectNetworkInterfaceId && (
                        <div className="relative z-0 w-full mb-5">
                            <input
                                type="text"
                                name="networkInterfaceId"
                                value={networkInterfaceId}
                                onChange={e => setNetworkInterfaceId(e.target.value)}
                                placeholder=" "
                                className="pt-3 pb-2 block w-full px-0 mt-0 bg-transparent border-0 border-b-2 appearance-none focus:outline-none focus:ring-0 focus:border-black border-gray-200"
                            />
                            <label htmlFor="networkInterfaceId" className="absolute duration-300 top-3 -z-1 origin-0 text-gray-500">Network Interface Identifier</label>
                            <span className="text-sm text-red-600 hidden" id="error">Network Interface Identifier</span>
                        </div>
                    )}

                    <div className="relative z-0 w-full mb-5">
                        <select
                            name="injectionType"
                            defaultValue={injectionType}
                            onChange={e => setInjectionType(e.target.value)}
                            className="pt-3 pb-2 block w-full px-0 mt-0 bg-transparent border-0 border-b-2 appearance-none z-1 focus:outline-none focus:ring-0 focus:border-black border-gray-200"
                        >
                            <option defaultValue="Hardware" disabled hidden>Hardware</option>
                        </select>
                        <label htmlFor="select" className="absolute duration-300 top-3 -z-1 origin-0 text-gray-500">Injection Type</label>
                        <span className="text-sm text-red-600 hidden" id="error">Option has to be selected</span>
                    </div>

                    <div className="flex flex-row space-x-4">
                        <div className="relative z-0 w-full mb-5">
                            <input
                                value={timeToFail}
                                onChange={e => setTimeToFail(e.target.value)}
                                type="text"
                                name="timeToFail"
                                placeholder=" "
                                className="pt-3 pb-2 block w-full px-0 mt-0 bg-transparent border-0 border-b-2 appearance-none focus:outline-none focus:ring-0 focus:border-black border-gray-200"
                            />
                            <div className="absolute top-0 right-0 mt-3 mr-4 text-gray-400">min</div>
                            <label htmlFor="timeToFail" className="absolute duration-300 top-3 -z-1 origin-0 text-gray-500">TTF</label>
                            <span className="text-sm text-red-600 hidden" id="error">TTF is required</span>
                        </div>
                        <div className="relative z-0 w-full">
                            <input
                                value={timeToRepair}
                                onChange={e => setTimeToRepair(e.target.value)}
                                type="text"
                                name="timeToRepair"
                                placeholder=" "
                                className="pt-3 pb-2 block w-full px-0 mt-0 bg-transparent border-0 border-b-2 appearance-none focus:outline-none focus:ring-0 focus:border-black border-gray-200"
                            />
                            <div className="absolute top-0 right-0 mt-3 mr-4 text-gray-400">min</div>
                            <label htmlFor="timeToRepair" className="absolute duration-300 top-3 -z-1 origin-0 text-gray-500">TTR</label>
                            <span className="text-sm text-red-600 hidden" id="error">Time To Repair is required</span>
                        </div>
                    </div>

                    <div className="relative z-0 w-full mb-5">
                        <input
                            value={experimentAttempts}
                            onChange={e => setExperimentAttempts(e.target.value)}
                            type="number"
                            name="experimentAttempts"
                            placeholder=" "
                            className="pt-3 pb-2 pl-5 block w-full px-0 mt-0 bg-transparent border-0 border-b-2 appearance-none focus:outline-none focus:ring-0 focus:border-black border-gray-200"
                        />
                        <div className="absolute top-0 right-0 mt-3 mr-4 text-gray-400">attempts</div>
                        <label htmlFor="experimentAttempts" className="absolute duration-300 top-3 left-5 -z-1 origin-0 text-gray-500">Experiment Attempts</label>
                        <span className="text-sm text-red-600 hidden" id="error">Attempts is required</span>
                    </div>

                    <button
                        id="button"
                        type="button"
                        className="w-full px-6 py-3 mt-3 text-lg text-white transition-all duration-150 ease-linear rounded-lg shadow outline-none bg-red-600 hover:bg-red-800 hover:shadow-lg focus:outline-none"
                        onClick={handleOnSubmit}
                    >
                        {loading ? <Loading /> : 'Inject'}
                    </button>

                </form>)}
            </div>
        </div>

    )
}


export default Form;