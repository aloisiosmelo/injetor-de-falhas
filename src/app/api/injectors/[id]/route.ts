'use server'

import { NextResponse, NextRequest } from "next/server";
const fs = require('fs');

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {

  const caminhoDoArquivo = `src/app/outputLogs/${params.id}.json`;
  const data = await fs.readFileSync(caminhoDoArquivo, 'utf8');

  return NextResponse.json(JSON.parse(data));
}