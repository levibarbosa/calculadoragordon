/*
  ARQUIVO JAVASCRIPT (JS)
  Aqui fica a lógica da calculadora. É o "cérebro" da página.
  Ele escuta os cliques nos botões e faz as contas matemáticas.
*/

// Seleciona elementos da página pelo ID para podermos manipulá-los
const mode = document.getElementById('mode');       // O seletor de modo (Gordon ou P/L)
const peBox = document.getElementById('peBox');     // A caixa do P/L Alvo (que aparece/desaparece)
const resultCard = document.getElementById('result'); // O cartão onde mostramos o resultado

/*
  EVENT LISTENER: MUDANÇA DE MODO
  Quando o usuário muda a opção no seletor 'mode', executamos esta função.
*/
mode.addEventListener('change', () => {
  // Se o valor for 'simple_pe', mostramos a caixa (flex). Se não, escondemos (none).
  peBox.style.display = mode.value === 'simple_pe' ? 'flex' : 'none';
});

/*
  FUNÇÃO AUXILIAR: FORMATAR NÚMERO
  Recebe um número (x) e o transforma em texto formatado para o Brasil (R$ 1.234,56).
*/
function formatBR(x) {
  return Number(x).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/*
  EVENT LISTENER: BOTÃO CALCULAR
  Toda a mágica acontece aqui quando o usuário clica em "Calcular".
*/
document.getElementById('calc').addEventListener('click', () => {
  // 1. PEGAR OS DADOS (INPUTS)
  // parseFloat converte o texto do input em número decimal.
  const price = parseFloat(document.getElementById('price').value);
  const eps = parseFloat(document.getElementById('eps').value);
  const g = parseFloat(document.getElementById('g').value) / 100; // Divide por 100 para virar porcentagem (5% = 0.05)
  const r = parseFloat(document.getElementById('r').value) / 100;
  const mos = parseFloat(document.getElementById('mos').value) / 100;
  const years = parseInt(document.getElementById('years').value) || 0; // parseInt para números inteiros
  const out = document.getElementById('out'); // Onde vamos escrever o resultado

  // Mostra o cartão de resultado
  resultCard.style.display = 'block';

  // 2. VALIDAÇÃO BÁSICA
  // Verifica se o EPS ou Preço estão vazios ou inválidos.
  if (!eps || (!price && price !== 0)) {
    out.innerHTML = '<div style="color:var(--danger); text-align:center;">Por favor, preencha o Preço Atual e o LPA/Fluxo corretamente.</div>';
    return; // Para a execução aqui se houver erro
  }

  let intrinsic = 0;  // Valor intrínseco calculado
  let precoTeto = 0;  // Preço máximo a pagar (com margem de segurança)
  let statusHtml = '';
  let detailsHtml = '';

  // 3. CÁLCULOS
  if (mode.value === 'gordon') {
    // --- Lógica do Modelo de Gordon ---
    
    // Validações específicas de Gordon
    if (isNaN(g) || isNaN(r)) {
      out.innerHTML = '<div style="color:var(--danger); text-align:center;">Para o Modelo de Gordon, as taxas de crescimento (g) e retorno (r) são obrigatórias.</div>';
      return;
    }
    if (r <= g) {
      out.innerHTML = '<div style="color:var(--danger); text-align:center;">A taxa de retorno (r) deve ser maior que o crescimento (g) matematicamente.</div>';
      return;
    }

    // FÓRMULA DE GORDON: Valor = (EPS * (1 + g)) / (r - g)
    intrinsic = eps * (1 + g) / (r - g);
    
    // Aplica a Margem de Segurança (Desconto)
    precoTeto = intrinsic * (1 - mos);
    
    // Calcula o P/L implícito apenas para curiosidade
    const impliedPE = intrinsic / eps;

    // Monta o HTML do resultado detalhado
    detailsHtml = `
      <div class="result-row"><span class="result-label">Preço Atual</span> <span class="result-value">R$ ${formatBR(price)}</span></div>
      <div class="result-row"><span class="result-label">Valor Intrínseco (Gordon)</span> <span class="result-value">R$ ${formatBR(intrinsic)}</span></div>
      <div class="result-row"><span class="result-label">Preço Teto (Margem ${Math.round(mos*100)}%)</span> <span class="result-value">R$ ${formatBR(precoTeto)}</span></div>
      <div class="result-row"><span class="result-label">P/L Implícito</span> <span class="result-value">${impliedPE.toFixed(2)}x</span></div>
    `;

    // Se o usuário pediu projeção futura (anos > 0)
    if (years > 0) {
      // Juros compostos para projetar o EPS futuro
      const futureEPS = eps * Math.pow(1 + g, years);
      const futureIntrinsic = futureEPS * (1 + g) / (r - g);
      
      detailsHtml += `
        <div style="margin-top:16px; padding-top:16px; border-top:1px solid var(--border-color);">
          <div style="font-size:13px; color:var(--text-muted); margin-bottom:8px;">Projeção para ${years} anos:</div>
          <div class="result-row"><span class="result-label">LPA Futuro</span> <span class="result-value">R$ ${formatBR(futureEPS)}</span></div>
          <div class="result-row"><span class="result-label">Valor Intrínseco Futuro</span> <span class="result-value">R$ ${formatBR(futureIntrinsic)}</span></div>
        </div>
      `;
    }

  } else {
    // --- Lógica do P/L Alvo ---
    const targetPE = parseFloat(document.getElementById('targetPE').value);
    
    if (!targetPE || targetPE <= 0) {
      out.innerHTML = '<div style="color:var(--danger); text-align:center;">Informe um P/L Alvo válido.</div>';
      return;
    }
    
    // Fórmula simples: Valor = EPS * P/L Alvo
    intrinsic = eps * targetPE;
    precoTeto = intrinsic * (1 - mos);

    detailsHtml = `
      <div class="result-row"><span class="result-label">Preço Atual</span> <span class="result-value">R$ ${formatBR(price)}</span></div>
      <div class="result-row"><span class="result-label">Valor Intrínseco (P/L ${targetPE}x)</span> <span class="result-value">R$ ${formatBR(intrinsic)}</span></div>
      <div class="result-row"><span class="result-label">Preço Teto (Margem ${Math.round(mos*100)}%)</span> <span class="result-value">R$ ${formatBR(precoTeto)}</span></div>
    `;
  }

  // 4. VEREDITO (CARO OU BARATO?)
  const isCheap = price <= precoTeto; // É barato se o preço for menor ou igual ao teto
  
  // Define as classes e textos baseados no veredito
  const statusClass = isCheap ? 'status-cheap' : 'status-expensive';
  const statusText = isCheap ? 'Oportunidade (Abaixo do Teto)' : 'Caro (Acima do Teto)';
  const statusIcon = isCheap ? '✅' : '❌';

  statusHtml = `
    <div style="text-align:center; margin-top:16px;">
      <div class="status-badge ${statusClass}">
        ${statusIcon} &nbsp; ${statusText}
      </div>
    </div>
  `;

  // Injeta o HTML final na página
  out.innerHTML = detailsHtml + statusHtml;
});

/*
  EVENT LISTENER: BOTÃO LIMPAR
  Reseta todos os campos para o estado inicial.
*/
document.getElementById('reset').addEventListener('click', () => {
  // Limpa todos os inputs listados
  ['price', 'eps', 'g', 'r', 'mos', 'years', 'targetPE'].forEach(id => document.getElementById(id).value = '');
  
  // Restaura valores padrão
  document.getElementById('mos').value = '25';
  document.getElementById('mode').value = 'gordon';
  
  // Esconde resultados e caixas extras
  resultCard.style.display = 'none';
  document.getElementById('out').innerHTML = '';
  document.getElementById('peBox').style.display = 'none';
});
