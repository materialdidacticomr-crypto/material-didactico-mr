
import "server-only";

import { google } from "googleapis";
import { GoogleAuth } from "google-auth-library";
import fs from "node:fs";
import path from "node:path";

const SERVICE_ACCOUNT_FILE = path.join(
  process.cwd(),
  "secrets",
  "biblioteca-mr-drive.json"
);

const TIPO_CARPETA = "application/vnd.google-apps.folder";
const TIPO_PDF = "application/pdf";

export interface MaterialDrive {
  id: string;
  name: string;
  mimeType: string;
  size?: string | null;
  modifiedTime?: string | null;
  rutaCarpeta: string;
}

function obtenerCredenciales() {
  const credencialesEnv = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;

  if (credencialesEnv) {
    try {
      return JSON.parse(credencialesEnv);
    } catch {
      throw new Error(
        "La variable GOOGLE_SERVICE_ACCOUNT_JSON no contiene JSON válido."
      );
    }
  }

  if (fs.existsSync(SERVICE_ACCOUNT_FILE)) {
    return JSON.parse(
      fs.readFileSync(SERVICE_ACCOUNT_FILE, "utf8")
    );
  }

  throw new Error(
    "No se encontraron las credenciales de Google Drive."
  );
}

function obtenerClienteDrive() {
  const credenciales = obtenerCredenciales();

  const auth = new GoogleAuth({
    credentials: credenciales,
    scopes: [
      "https://www.googleapis.com/auth/drive.readonly",
    ],
  });

  return google.drive({
    version: "v3",
    auth,
  });
}

export async function verificarConexionDrive() {
  const drive = obtenerClienteDrive();

  const respuesta = await drive.about.get({
    fields: "user",
  });

  return {
    conectado: true,
    cuenta: respuesta.data.user?.emailAddress ?? null,
  };
}

export async function listarMaterialesDrive(): Promise<MaterialDrive[]> {
  const drive = obtenerClienteDrive();

  const folderId = process.env.GOOGLE_DRIVE_BIBLIOTECA_FOLDER_ID;

  if (!folderId) {
    throw new Error(
      "Falta configurar GOOGLE_DRIVE_BIBLIOTECA_FOLDER_ID."
    );
  }

  const materiales: MaterialDrive[] = [];
  const carpetasVisitadas = new Set<string>();
  const archivosRegistrados = new Set<string>();

  async function recorrerCarpeta(
    idCarpeta: string,
    rutaActual: string
  ): Promise<void> {
    if (carpetasVisitadas.has(idCarpeta)) {
      return;
    }

    carpetasVisitadas.add(idCarpeta);

    let pageToken: string | undefined;

    do {
      const respuesta = await drive.files.list({
        q: `'${idCarpeta}' in parents and trashed = false`,
        fields:
          "nextPageToken,files(id,name,mimeType,size,modifiedTime,parents)",
        orderBy: "name",
        pageSize: 1000,
        pageToken,
        supportsAllDrives: true,
        includeItemsFromAllDrives: true,
      });

      const archivos = respuesta.data.files ?? [];

      for (const archivo of archivos) {
        if (!archivo.id || !archivo.name) {
          continue;
        }

        if (archivo.mimeType === TIPO_CARPETA) {
          const nuevaRuta = rutaActual
            ? `${rutaActual}/${archivo.name}`
            : archivo.name;

          await recorrerCarpeta(archivo.id, nuevaRuta);
          continue;
        }

        if (
          archivo.mimeType === TIPO_PDF &&
          !archivosRegistrados.has(archivo.id)
        ) {
          archivosRegistrados.add(archivo.id);

          materiales.push({
            id: archivo.id,
            name: archivo.name,
            mimeType: archivo.mimeType,
            size: archivo.size ?? null,
            modifiedTime: archivo.modifiedTime ?? null,
            rutaCarpeta: rutaActual || "Biblioteca MR",
          });
        }
      }

      pageToken = respuesta.data.nextPageToken ?? undefined;
    } while (pageToken);
  }

  await recorrerCarpeta(folderId, "");

  return materiales;
}

export async function obtenerInformacionArchivo(fileId: string) {
  const drive = obtenerClienteDrive();

  const respuesta = await drive.files.get({
    fileId,
    fields: "id,name,mimeType,size,modifiedTime,parents",
    supportsAllDrives: true,
  });

  return respuesta.data;
}

export async function obtenerArchivoDrive(fileId: string) {
  const drive = obtenerClienteDrive();

  const respuesta = await drive.files.get(
    {
      fileId,
      alt: "media",
      supportsAllDrives: true,
    },
    {
      responseType: "arraybuffer",
    }
  );

  return Buffer.from(respuesta.data as ArrayBuffer);
}
