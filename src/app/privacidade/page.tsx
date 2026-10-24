import { LegalPage } from "@/components/legal/legal-page";

export const metadata = { title: "Política de Privacidade" };

const CONTACT = process.env.NEXT_PUBLIC_PRIVACY_CONTACT ?? "o responsável pelo app, pelo canal informado na roda";

export default function PrivacidadePage() {
  return (
    <LegalPage title="Política de Privacidade" updated="19 de outubro de 2026 (versão 2026-10-19)">
      <p>
        Esta Política explica como o <strong>Avalie Bolados</strong> trata seus dados pessoais, em conformidade com a Lei Geral de
        Proteção de Dados (Lei 13.709/2018, “LGPD”). Resumo: coletamos o mínimo, mostramos só para a sua roda, não vendemos nada e
        você controla tudo pelas configurações.
      </p>

      <h2>1. Dados que tratamos</h2>
      <ul>
        <li><strong>Cadastro:</strong> nome, nome de usuário, e-mail, data de nascimento e senha (guardada só como hash pelo provedor de autenticação).</li>
        <li><strong>Login com Google (opcional):</strong> recebemos do Google só o seu nome e e-mail. Não acessamos contatos, arquivos nem outros dados da sua conta Google.</li>
        <li><strong>Perfil:</strong> foto, bio, nível, XP, Brasas, itens e conquistas.</li>
        <li><strong>Uso do app:</strong> bolados registrados (tipo, data, hora, seda, piteira, observações), avaliações dadas e recebidas, feedbacks, fotos e vídeos enviados, rodas de que participa.</li>
        <li><strong>Técnicos:</strong> cookies essenciais de sessão e registros de acesso mantidos pelos provedores de infraestrutura por segurança.</li>
      </ul>
      <p>
        Registros sobre hábitos de consumo podem ser considerados <strong>dados pessoais sensíveis</strong>. Por isso eles só são
        tratados com o seu <strong>consentimento específico e destacado</strong>, dado no cadastro (art. 11, I, da LGPD).
      </p>

      <h2>2. Para que usamos</h2>
      <ul>
        <li>Criar e manter sua conta e autenticar seu acesso (execução do serviço, art. 7º, V).</li>
        <li>Mostrar bolados, notas, ranking e histórico para os membros das suas rodas (consentimento, art. 7º, I e art. 11, I).</li>
        <li>Calcular XP, níveis, conquistas e Brasas.</li>
        <li>Garantir segurança e prevenir fraudes e abusos (legítimo interesse, art. 7º, IX).</li>
        <li>Verificar a maioridade.</li>
      </ul>
      <p>Não usamos seus dados para publicidade, não traçamos perfil comercial e <strong>não vendemos nem compartilhamos dados</strong> com anunciantes.</p>

      <h2>3. Quem vê o quê</h2>
      <ul>
        <li>Por padrão, seu perfil, bolados, avaliações e mídias são visíveis <strong>só para os membros das rodas</strong> em que você está.</li>
        <li>Se você ligar o “perfil público”, qualquer usuário logado verá seu nome, @, nível, título, conquistas e médias agregadas, e você aparecerá no ranking global. Fotos e avaliações continuam restritas às rodas.</li>
        <li>As regras de acesso são aplicadas no próprio banco de dados (Row Level Security), não só na tela.</li>
      </ul>

      <h2>4. Onde ficam os dados</h2>
      <p>
        Usamos a <strong>Supabase</strong> (banco de dados, autenticação e armazenamento de arquivos) e a <strong>Vercel</strong>
        (hospedagem). Esses operadores podem armazenar dados fora do Brasil, com salvaguardas contratuais adequadas (art. 33 da
        LGPD). Fotos e vídeos ficam em armazenamento privado e só são acessados por links temporários e assinados.
      </p>

      <h2>5. Por quanto tempo</h2>
      <ul>
        <li>Enquanto sua conta existir.</li>
        <li>Ao excluir a conta, apagamos imediatamente perfil, bolados, avaliações feitas, mídias enviadas e consentimentos. Cópias de segurança dos provedores expiram no ciclo deles.</li>
        <li>Itens que você apagar (um bolado, uma foto) somem na hora.</li>
      </ul>

      <h2>6. Seus direitos</h2>
      <p>Pela LGPD (art. 18), você pode, a qualquer momento:</p>
      <ul>
        <li><strong>Acessar e portar</strong> seus dados: Configurações → Meus dados → Exportar (arquivo JSON).</li>
        <li><strong>Corrigir</strong> dados: Configurações → Perfil e Conta.</li>
        <li><strong>Revogar o consentimento</strong> de dados sensíveis: Configurações → Meus dados.</li>
        <li><strong>Excluir</strong> a conta e os dados: Configurações → Meus dados → Excluir minha conta.</li>
        <li>Pedir informações sobre o tratamento e reclamar à Autoridade Nacional de Proteção de Dados (ANPD).</li>
      </ul>

      <h2>7. Segurança</h2>
      <p>
        Conexão criptografada (HTTPS), senhas com hash, políticas de acesso no banco, armazenamento privado, cabeçalhos de segurança e
        validação no servidor. Nenhum sistema é 100% seguro: se houver incidente relevante, avisaremos os afetados e a ANPD.
      </p>

      <h2>8. Cookies</h2>
      <p>Usamos só cookies essenciais para manter você logado. Não usamos cookies de rastreamento nem de publicidade.</p>

      <h2>9. Contato</h2>
      <p>Dúvidas ou pedidos sobre seus dados: fale com {CONTACT}.</p>
    </LegalPage>
  );
}
