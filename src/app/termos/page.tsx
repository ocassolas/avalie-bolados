import { LegalPage } from "@/components/legal/legal-page";

export const metadata = { title: "Termos de Uso" };

export default function TermosPage() {
  return (
    <LegalPage title="Termos de Uso" updated="19 de outubro de 2026 (versão 2026-10-19)">
      <p>
        Estes Termos regem o uso do <strong>Avalie Bolados</strong> (“app”), um aplicativo para grupos de amigos registrarem e
        avaliarem bolados de tabaco e de outras ervas por meio de um checklist, com notas, ranking e recursos de gamificação. Ao
        criar uma conta, você concorda com estes Termos e com a Política de Privacidade.
      </p>

      <h2>1. Quem pode usar</h2>
      <ul>
        <li>Somente pessoas com <strong>18 anos ou mais</strong>. A data de nascimento é pedida no cadastro e contas de menores são recusadas.</li>
        <li>Você é responsável pela veracidade dos dados informados e pela segurança da sua senha.</li>
      </ul>

      <h2>2. O que o app é e o que não é</h2>
      <ul>
        <li>O app é uma ferramenta de registro e avaliação entre adultos, com fins recreativos.</li>
        <li>O app <strong>não vende, não anuncia, não intermedeia e não incentiva</strong> a compra ou o consumo de qualquer substância.</li>
        <li>Fumar faz mal à saúde. Você é o único responsável por seus hábitos e por respeitar a legislação do lugar onde está.</li>
      </ul>

      <h2>3. Regras de convivência</h2>
      <ul>
        <li>Publique só fotos e vídeos seus ou com autorização de quem aparece neles.</li>
        <li>É proibido publicar conteúdo com menores de idade, nudez, violência, discurso de ódio, dados pessoais de terceiros ou qualquer conteúdo ilegal.</li>
        <li>Não tente burlar o sistema de pontuação, acessar dados de outras rodas ou atacar a infraestrutura do app.</li>
        <li>Donos e admins de roda podem remover membros e conteúdos da roda.</li>
      </ul>

      <h2>4. Pontos, Brasas e itens</h2>
      <p>
        XP, níveis, Brasas, conquistas, temas, molduras e títulos são recursos virtuais <strong>sem valor monetário</strong>, não
        podem ser vendidos, trocados por dinheiro ou transferidos, e podem ser ajustados para manter o jogo justo.
      </p>

      <h2>5. Seu conteúdo</h2>
      <p>
        Você continua dono do que publica. Ao publicar, autoriza o app a armazenar e exibir esse conteúdo para os membros da roda
        correspondente, só para o funcionamento do serviço. Ao excluir um conteúdo ou a conta, ele é apagado conforme a Política de
        Privacidade.
      </p>

      <h2>6. Suspensão e encerramento</h2>
      <p>
        Contas que violarem estes Termos podem ser suspensas ou excluídas. Você pode excluir sua conta a qualquer momento em
        Configurações → Meus dados.
      </p>

      <h2>7. Garantias e responsabilidade</h2>
      <p>
        O app é oferecido “como está”, sem garantia de disponibilidade contínua. Na extensão permitida pela lei, não nos
        responsabilizamos por danos decorrentes do uso do app ou do conteúdo publicado por usuários.
      </p>

      <h2>8. Mudanças</h2>
      <p>
        Podemos atualizar estes Termos. Mudanças relevantes serão avisadas no app e, quando necessário, pediremos um novo aceite.
      </p>

      <h2>9. Lei e foro</h2>
      <p>Estes Termos seguem as leis brasileiras. Fica eleito o foro do domicílio do usuário, conforme o Código de Defesa do Consumidor.</p>
    </LegalPage>
  );
}
