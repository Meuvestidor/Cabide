/**
 * Prepara a foto de uma peça antes de enviar: fotos da câmera do celular
 * costumam ter 3–8 MB, acima do limite de corpo da Vercel (4,5 MB) e do
 * limite de imagem da IA (5 MB). Reduz o lado maior e recodifica em JPEG,
 * respeitando a orientação EXIF. Se o navegador não conseguir decodificar,
 * devolve o arquivo original.
 */
const LADO_MAXIMO = 1600;
const QUALIDADE = 0.85;

export async function prepararFoto(file: File): Promise<File> {
  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
    const escala = Math.min(1, LADO_MAXIMO / Math.max(bitmap.width, bitmap.height));
    const largura = Math.round(bitmap.width * escala);
    const altura = Math.round(bitmap.height * escala);

    const canvas = document.createElement('canvas');
    canvas.width = largura;
    canvas.height = altura;
    const ctx = canvas.getContext('2d');
    if (!ctx) return file;
    // Fundo branco para PNGs com transparência (JPEG não tem alfa).
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, largura, altura);
    ctx.drawImage(bitmap, 0, 0, largura, altura);
    bitmap.close?.();

    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', QUALIDADE));
    if (!blob) return file;
    const nome = (file.name.replace(/\.[^.]+$/, '') || 'peca') + '.jpg';
    return new File([blob], nome, { type: 'image/jpeg' });
  } catch {
    return file;
  }
}
