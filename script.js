/* =========================================================
   script.js
   Aqui fica o COMPORTAMENTO: salvar, ler, mostrar, buscar e apagar.
   Leia os comentarios. Voce precisa saber explicar este arquivo.
   ========================================================= */

// A "etiqueta" da gaveta do navegador onde tudo fica guardado.
const CHAVE = "luzRadia-dados";

// Pegamos os pedacos da pagina com que vamos trabalhar.
const formulario = document.getElementById("formulario");
const listaEl    = document.getElementById("lista");
const painel     = document.getElementById("painel");
const busca      = document.getElementById("busca");
const filtro     = document.getElementById("filtro");
const aviso      = document.getElementById("aviso");

/* ---------- 1. LER o que esta salvo ----------
   A gaveta so guarda texto, entao JSON.parse transforma o
   texto de volta em lista. */
function lerFichas(){
  const texto = localStorage.getItem(CHAVE);
  if(!texto) return [];
  try { return JSON.parse(texto); } catch(erro){ return []; }
}

/* ---------- 2. GRAVAR na gaveta ----------
   JSON.stringify faz o caminho contrario: lista vira texto. */
function gravarFichas(fichas){
  localStorage.setItem(CHAVE, JSON.stringify(fichas));
}

/* ---------- 3. Protecao simples ----------
   Se alguem digitar codigo no formulario, isto neutraliza. */
function escapar(texto){
  const caixa = document.createElement("div");
  caixa.textContent = texto;
  return caixa.innerHTML;
}

/* ---------- 4. MOSTRAR na tela ----------
   Apaga a lista atual e desenha tudo de novo a partir da gaveta. */
function mostrar(){
  const fichas = lerFichas();
  const termo = busca.value.trim().toLowerCase();
  const escolhida = filtro.value;

  const visiveis = fichas.filter(function(f){
    const passaFiltro = (escolhida === "todas") || (f.categoria === escolhida);
    const textoTodo = Object.values(f).join(" ").toLowerCase();
    const passaBusca = (termo === "") || (textoTodo.indexOf(termo) >= 0);
    return passaFiltro && passaBusca;
  });

  listaEl.innerHTML = "";

  if(visiveis.length === 0){
    listaEl.innerHTML = '<p class="vazio">Nenhum registro aqui ainda. Preencha o formulario acima para comecar.</p>';
    desenharPainel(fichas);
    return;
  }

  visiveis.forEach(function(f){
    const cartao = document.createElement("article");
    cartao.className = "cartao";
    cartao.setAttribute("data-categoria", f.categoria);
    let html = "";
    html += "<h3>" + escapar(f.tituloDaAcao) + "</h3>";
    html += '<span class="etiqueta">' + escapar(f.categoria) + "</span>";
    html += "<p><b>Local:</b> " + escapar(f.local) + "</p>";
    html += "<p><b>Quantas pessoas participaram:</b> " + escapar(f.quantasPessoasParticipar) + "</p>";
    html += "<p><b>O que foi feito:</b> " + escapar(f.oQueFoiFeito) + "</p>";
    html += '<footer><small>' + escapar(f.data) + '</small>' +
            '<button type="button" class="apagar" data-id="' + f.id + '">Apagar</button></footer>';
    cartao.innerHTML = html;
    listaEl.appendChild(cartao);
  });

  desenharPainel(fichas);
}

/* ---------- 5. O PAINEL de numeros ----------
   E daqui que sai o dado que voce vai mostrar na apresentacao. */
function desenharPainel(fichas){
  let html = "";
  html += '<div class="numero"><b>' + fichas.length + "</b><span>registros no total</span></div>";
  const soma = fichas.reduce(function(total, f){ return total + Number(f.quantasPessoasParticipar || 0); }, 0);
  html += '<div class="numero"><b>' + soma + "</b><span>quantas pessoas participaram, somando tudo</span></div>";
  const porCategoria = {};
  fichas.forEach(function(f){ porCategoria[f.categoria] = (porCategoria[f.categoria] || 0) + 1; });
  Object.keys(porCategoria).forEach(function(nome){
    html += '<div class="numero pequeno"><b>' + porCategoria[nome] + "</b><span>" + escapar(nome) + "</span></div>";
  });
  painel.innerHTML = html;
}

/* ---------- 6. SALVAR quando o formulario for enviado ---------- */
formulario.addEventListener("submit", function(evento){
  evento.preventDefault();   // impede a pagina de recarregar

  const nova = {
    id: Date.now(),          // numero unico: a hora exata em milissegundos
    tituloDaAcao: document.getElementById("tituloDaAcao").value.trim(),
    categoria: document.getElementById("categoria").value.trim(),
    local: document.getElementById("local").value.trim(),
    quantasPessoasParticipar: Number(document.getElementById("quantasPessoasParticipar").value),
    oQueFoiFeito: document.getElementById("oQueFoiFeito").value.trim(),
    data: new Date().toLocaleDateString("pt-BR")
  };

  const fichas = lerFichas();
  fichas.unshift(nova);      // unshift coloca no comeco da lista
  gravarFichas(fichas);

  formulario.reset();
  mostrar();
  aviso.textContent = "Registro salvo. Recarregue a pagina para conferir que ele continua ai.";
  setTimeout(function(){ aviso.textContent = ""; }, 4000);
});

/* ---------- 7. APAGAR um registro ----------
   O botao de apagar nasce depois que a pagina carrega, entao
   escutamos o clique na lista inteira e verificamos o que foi clicado. */
listaEl.addEventListener("click", function(evento){
  if(!evento.target.classList.contains("apagar")) return;
  const id = Number(evento.target.getAttribute("data-id"));
  const fichas = lerFichas().filter(function(f){ return f.id !== id; });
  gravarFichas(fichas);
  mostrar();
});

/* ---------- 8. BUSCAR, FILTRAR e APAGAR TUDO ---------- */
busca.addEventListener("input", mostrar);
filtro.addEventListener("change", mostrar);

document.getElementById("limpar").addEventListener("click", function(){
  if(confirm("Apagar todos os registros deste navegador?")){
    localStorage.removeItem(CHAVE);
    mostrar();
  }
});

/* ---------- 9. BAIXAR e CARREGAR os dados ----------
   Serve para levar os registros de um computador para outro,
   por exemplo do seu para o da apresentacao. */
document.getElementById("exportar").addEventListener("click", function(){
  const texto = JSON.stringify(lerFichas(), null, 2);
  const arquivo = new Blob([texto], {type: "application/json"});
  const link = document.createElement("a");
  link.href = URL.createObjectURL(arquivo);
  link.download = "dados-do-projeto.json";
  link.click();
  URL.revokeObjectURL(link.href);
});

document.getElementById("importar").addEventListener("change", function(evento){
  const arquivo = evento.target.files[0];
  if(!arquivo) return;
  const leitor = new FileReader();
  leitor.onload = function(){
    try {
      const recebidas = JSON.parse(leitor.result);
      if(!Array.isArray(recebidas)) throw new Error("formato errado");
      gravarFichas(recebidas.concat(lerFichas()));
      mostrar();
      aviso.textContent = recebidas.length + " registros carregados.";
    } catch(erro){
      aviso.textContent = "Esse arquivo nao e um backup valido deste site.";
    }
  };
  leitor.readAsText(arquivo);
});

/* ---------- 10. Ao abrir a pagina, mostra o que ja estava salvo ---------- */
mostrar();