'use server'

const fs = require('fs');

import { NextResponse } from "next/server";
import { faultInjectionHw } from '@/app/faultScripts/hardware'

const generateUniqueRandomSequence = () => Math.floor(Math.random() * Date.now());

export async function POST(request: Request) {

  const data = await request.formData();

  if (request == null || request == undefined) {
    return NextResponse.json({ message: 'Bad Request' }, { status: 400 });
  }

  // gerar uma chave
  const LOG_ID = generateUniqueRandomSequence();
  const content = [{ message: 'Fault injection hardware...' }]

  fs.writeFileSync(`src/app/outputLogs/${LOG_ID}.json`, JSON.stringify(content, null, 2), 'utf8');

  if (data.get('injectionType') === 'Hardware') {

    faultInjectionHw(
      data.get('ip'),
      data.get('injectionType'),
      data.get('sshPassword'),
      data.get('sshUsername'),
      LOG_ID
    );

  }

  return NextResponse.json({ log_id: LOG_ID }, { status: 200 });
}