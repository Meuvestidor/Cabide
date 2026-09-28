import type { Metadata } from 'next';
import { EmailContato, PaginaInfo } from '@/components/info/PaginaInfo';

export const metadata: Metadata = { title: 'Ajuda · Cabidê' };

const TEMAS: { titulo: string; perguntas: { p: string; r: string }[] }[] = [
  {
    titulo: 'Minha conta',
    perguntas: [
      {
        p: 'Como entrar no Cabidê?',
        r: 'Você pode entrar utilizando sua conta Google ou experimentar o Cabidê sem criar uma conta.',
      },
      {
        p: 'O que significa "Experimentar Cabidê"?',
        r: 'É uma forma de conhecer e utilizar o Cabidê sem criar uma conta permanente. Enquanto você estiver experimentando, seus dados ficam associados à sua sessão.',
      },
      {
        p: 'Como crio minha conta?',
        r: 'Durante a experiência, você poderá escolher Criar minha conta e continuar com Google. Seus dados existentes permanecem associados ao seu perfil.',
      },
    ],
  },
  {
    titulo: 'Meu armário',
    perguntas: [
      {
        p: 'Como adiciono uma peça?',
        r: 'Acesse Armário e selecione Adicionar peça. Você poderá fotografar ou enviar uma imagem da peça.',
      },
      {
        p: 'Posso editar uma peça depois?',
        r: 'Sim. Abra a peça no seu armário para visualizar ou editar suas informações.',
      },
    ],
  },
  {
    titulo: 'Meu estilo',
    perguntas: [
      {
        p: 'Posso alterar meu Retrato Cabidê?',
        r: 'Sim. Acesse Meu Perfil → Editar meu estilo para revisar suas respostas e atualizar suas preferências.',
      },
      {
        p: 'O Cabidê guarda minhas preferências?',
        r: 'Sim. As informações do seu Retrato são utilizadas para personalizar sua experiência e as sugestões de looks.',
      },
    ],
  },
  {
    titulo: 'Looks',
    perguntas: [
      {
        p: 'Como o Cabidê cria sugestões?',
        r: 'As sugestões consideram as informações do seu estilo, suas preferências e as peças disponíveis no seu armário.',
      },
    ],
  },
];

export default function AjudaPage() {
  return (
    <PaginaInfo titulo="Ajuda">
      <p className="display italic text-[1.35rem] text-muted -mt-4 mb-6">Como podemos ajudar?</p>

      {TEMAS.map((tema) => (
        <section key={tema.titulo} className="py-6 border-t border-border">
          <p className="eyebrow mb-3">{tema.titulo}</p>
          <div className="flex flex-col">
            {tema.perguntas.map(({ p, r }) => (
              <details key={p} className="group border-b border-border last:border-b-0">
                <summary className="flex items-center justify-between gap-4 py-4 cursor-pointer list-none text-[15px] font-semibold text-foreground [&::-webkit-details-marker]:hidden">
                  {p}
                  <span aria-hidden className="text-gold text-xl leading-none transition-transform group-open:rotate-45">+</span>
                </summary>
                <p className="pb-4 -mt-1 text-[15px] leading-relaxed text-foreground/85">{r}</p>
              </details>
            ))}
          </div>
        </section>
      ))}

      <section className="py-6 border-t border-border">
        <h2 className="display text-[1.5rem] mb-3">Ainda precisa de ajuda?</h2>
        <p className="text-[15px] leading-relaxed mb-2">Entre em contato:</p>
        <p><EmailContato /></p>
      </section>
    </PaginaInfo>
  );
}
