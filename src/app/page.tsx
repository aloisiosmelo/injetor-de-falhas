"use client";

import React, { useState } from 'react';
import { Flex, Select, Input, Button, Heading, Toast, InlineCode } from '@/once-ui/components';

export default function Home() {

	const [injectionType, setInjectionType] = useState<string>('')
	const [sshUsername, setSSHUsername] = useState<string>('')
	const [sshPassword, setSSHPassword] = useState<string>('')
	const [ip, setIp] = useState<string>('')
	const [loading, setLoading] = useState<boolean>(false)
	const [showToast, setShowToast] = useState<boolean>(false)
	const [logMenssages, setLogMessages] = useState<[]>();

	const callAPI = async () => {
		const payload = {
			ip,
			injectionType,
			sshPassword,
			sshUsername,
		}

		try {
			const resCreate = await fetch(
				`/api/injectors`,
				{
					method: 'POST',
					headers: {
						'Content-Type': 'application/x-www-form-urlencoded'
					},
					body: new URLSearchParams(
						payload
					)
				}
			);
			const data = await resCreate.json();

			if (data.log_id) {
				const fetchData = async () => {
					const res = await fetch(`/api/injectors/${data.log_id}`, {
						method: 'GET',
					});
					const result = await res.json();
					setLogMessages(logMenssages ? { logMenssages, ...result } : result)
				};

				fetchData();

				// const interval = setInterval(() => {
				// 	fetchData();
				// }, 1000);

				// setTimeout(() => {
				// 	clearInterval(interval);
				// }, 50000);

			}
		} catch (err) {
			console.log(err);
		}
	};

	const handleRun = async () => {
		setLoading(true)

		if (ip == '' || injectionType == '' || sshPassword == '' || sshUsername == '') {
			setShowToast(true)
			setLoading(false)
			setTimeout(() => setShowToast(false), 3000);
			return
		}

		await callAPI();

		setLoading(false)
	}


	return (
		<Flex
			fillWidth paddingTop="l" paddingX="l"
			direction="column" alignItems="center" flex={1} marginBottom='l'>

			<Heading paddingY='l'> Fault Injection </Heading>

			<Flex marginBottom='l' fillWidth>
				<Select
					id="injectionType"
					label="Select injection type"
					defaultChecked={true}
					defaultValue={'Hardware'}
					options={[
						{
							label: 'Hardware',
							value: 'Hardware'
						},
					]}
					value={injectionType}
					onSelect={(e) => setInjectionType(e.value)}
				/>
			</Flex>
			<Flex marginBottom='l' fillWidth>
				<Input
					id="ip"
					label="IP or URL"
					value={ip}
					onChange={(e) => setIp(e.target.value)}
				/>
			</Flex>
			<Flex marginBottom='l' fillWidth>
				<Input
					id="ssh-user"
					label="SSH Username"
					value={sshUsername}
					onChange={(e) => setSSHUsername(e.target.value)}
				/>
			</Flex>
			<Flex marginBottom='l' fillWidth>
				<Input
					id="ssh-pass"
					label="SSH Password"
					value={sshPassword}
					onChange={(e) => setSSHPassword(e.target.value)}
					type='password'
				/>
			</Flex>
			<Button
				variant="primary"
				size="m"
				label="Run"
				loading={loading}
				onClick={handleRun}
			/>
			<Flex
				fillWidth paddingTop="l" paddingX="l"
				direction="column" alignItems="center" flex={1}
			>
				{logMenssages && logMenssages.length > 0 && (
					<InlineCode style={{width:'100%', backgroundColor: 'black'}}>
						{logMenssages.map((log) => <p style={{color:'white'}}>{log.message}</p>)}
					</InlineCode>
				)}
			</Flex>

			{showToast && (<Toast
				variant="danger"
				children="Por favor, preencha todos os campos para continuar"
			/>)}

		</Flex>
	);
}
