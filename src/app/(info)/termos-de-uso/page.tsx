import type { Metadata } from 'next';
import { EmailContato, Lista, PaginaInfo, Secao } from '@/components/info/PaginaInfo';

export const metadata: Metadata = { title: 'Termos de uso · Cabidê' };

export default function TermosDeUsoPage() {
  return (
    <PaginaInfo titulo="Termos de uso" atualizacao="setembro de 2026">
      <p className="text-[15px] leading-relaxed mb-6">Ao utilizar o Cabidê, você concorda com estes Termos de Uso.</p>

      <Secao titulo="Sobre o Cabidê">
        <p>
          O Cabidê é uma ferramenta digital criada para ajudar você a organizar seu armário, registrar suas peças, explorar seu
          estilo e receber sugestões personalizadas de looks.
        </p>
        <p>
          O Cabidê oferece sugestões com base nas informações fornecidas por você. Essas sugestões têm caráter informativo e de
          estilo e não substituem uma consultoria profissional individual.
        </p>
      </Secao>

      <Secao titulo="Sua conta">
        <p>Você é responsável por manter o acesso à sua conta e pelas informações fornecidas ao Cabidê.</p>
        <p>
          Quando utilizar o modo Experimentar Cabidê, você poderá utilizar determinadas funcionalidades sem criar uma conta
          permanente. Nesse caso, os dados ficam associados à sessão utilizada e poderão não estar disponíveis caso a sessão seja
          encerrada.
        </p>
      </Secao>

      <Secao titulo="Conteúdo enviado por você">
        <p>Você mantém os direitos sobre as fotos e demais conteúdos que enviar ao Cabidê.</p>
        <p>Ao enviar conteúdo, você permite que o Cabidê o utilize na medida necessária para oferecer as funcionalidades do aplicativo.</p>
        <p>Você não deve enviar conteúdos que violem direitos de terceiros ou que sejam ilegais.</p>
      </Secao>

      <Secao titulo="Uso adequado">
        <p>Você concorda em utilizar o Cabidê de maneira legal e adequada e não tentar:</p>
        <Lista
          itens={[
            'acessar contas ou dados de outras pessoas;',
            'comprometer a segurança do aplicativo;',
            'utilizar o serviço para atividades ilegais;',
            'interferir no funcionamento do Cabidê.',
          ]}
        />
      </Secao>

      <Secao titulo="Disponibilidade do serviço">
        <p>
          Estamos constantemente desenvolvendo e melhorando o Cabidê. Por isso, algumas funcionalidades podem ser alteradas,
          atualizadas, suspensas ou descontinuadas.
        </p>
        <p>Também podemos realizar manutenções ou atualizações necessárias ao funcionamento do serviço.</p>
      </Secao>

      <Secao titulo="Encerramento">
        <p>Você pode deixar de utilizar o Cabidê a qualquer momento.</p>
        <p>
          Podemos suspender ou encerrar o acesso quando houver violação destes Termos ou quando isso for necessário por razões
          legais, de segurança ou funcionamento do serviço.
        </p>
      </Secao>

      <Secao titulo="Alterações destes termos">
        <p>
          Estes Termos podem ser atualizados para refletir mudanças no Cabidê ou nas obrigações legais aplicáveis. A versão mais
          recente estará disponível nesta página.
        </p>
      </Secao>

      <Secao titulo="Contato">
        <p>Dúvidas sobre estes Termos:</p>
        <p><EmailContato /></p>
      </Secao>
    </PaginaInfo>
  );
}
