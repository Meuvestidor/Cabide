import type { Metadata } from 'next';
import { EmailContato, Lista, PaginaInfo, Secao } from '@/components/info/PaginaInfo';

export const metadata: Metadata = { title: 'Privacidade · Cabidê' };

export default function PrivacidadePage() {
  return (
    <PaginaInfo titulo="Privacidade" atualizacao="setembro de 2026">
      <p className="text-[15px] leading-relaxed mb-6">
        No Cabidê, respeitamos sua privacidade e queremos que você entenda de forma simples quais informações utilizamos e por quê.
      </p>

      <Secao titulo="Informações que você fornece">
        <p>Dependendo de como você utiliza o Cabidê, podemos armazenar informações como:</p>
        <Lista
          itens={[
            'nome;',
            'e-mail;',
            'número de celular, quando informado;',
            'preferências de estilo;',
            'informações fornecidas no Retrato Cabidê;',
            'peças adicionadas ao seu armário;',
            'looks criados;',
            'preferências e interações dentro do aplicativo.',
          ]}
        />
      </Secao>

      <Secao titulo="Para que usamos essas informações">
        <p>Utilizamos essas informações para:</p>
        <Lista
          itens={[
            'criar e manter seu perfil;',
            'organizar seu armário;',
            'entender suas preferências de estilo;',
            'personalizar sugestões e looks;',
            'melhorar sua experiência dentro do Cabidê;',
            'manter a segurança e o funcionamento do aplicativo.',
          ]}
        />
      </Secao>

      <Secao titulo="Fotos das suas peças">
        <p>
          As fotos enviadas para o seu armário são utilizadas para organizar e apresentar suas peças dentro do Cabidê e para
          oferecer funcionalidades relacionadas ao seu armário.
        </p>
      </Secao>

      <Secao titulo="Sua conta">
        <p>
          Quando você utiliza o Cabidê com uma conta, seus dados ficam associados ao seu usuário para que possam ser recuperados
          quando você voltar ao aplicativo.
        </p>
        <p>
          Se você estiver utilizando o Cabidê no modo Experimentar Cabidê, seus dados ficam associados à sessão utilizada naquele
          momento. Se você sair antes de criar ou vincular uma conta, poderá perder o acesso a esses dados.
        </p>
      </Secao>

      <Secao titulo="Compartilhamento de informações">
        <p>Não vendemos seus dados pessoais.</p>
        <p>
          Podemos utilizar serviços de terceiros necessários para o funcionamento do Cabidê, como serviços de autenticação,
          armazenamento e processamento de informações. Esses serviços recebem somente as informações necessárias para executar
          suas respectivas funções.
        </p>
      </Secao>

      <Secao titulo="Seus direitos">
        <p>
          Você pode solicitar informações sobre seus dados pessoais, correção de informações incorretas e, quando aplicável,
          exclusão dos seus dados, observadas as obrigações legais e técnicas aplicáveis.
        </p>
      </Secao>

      <Secao titulo="Segurança">
        <p>
          Adotamos medidas técnicas e organizacionais destinadas a proteger suas informações contra acesso, alteração, divulgação
          ou destruição não autorizados.
        </p>
      </Secao>

      <Secao titulo="Contato">
        <p>Para dúvidas ou solicitações relacionadas à privacidade:</p>
        <p><EmailContato /></p>
      </Secao>
    </PaginaInfo>
  );
}
