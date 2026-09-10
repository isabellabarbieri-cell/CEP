// Pega as informações que vieram pela URL
// Ex: resultado.html?cep=88501000&cidade=Lages
const parametros = new URLSearchParams(window.location.search);


// Pega o CEP que foi colocado na página anterior
const cep = parametros.get("cep") || "";


// Pega a cidade que foi colocada na página anterior
const cidadeInformada = parametros.get("cidade") || "";


// Pega a parte do HTML onde vão aparecer os resultados
const resultado = document.getElementById("resultado");


// Pega o link que vai abrir o Google Maps
const linkMaps = document.getElementById("linkMaps");


// Função usada para deixar os textos mais fáceis de comparar
function normalizar(texto) {

    return texto

        // Separa as letras dos acentos
        .normalize("NFD")

        // Tira os acentos
        .replace(/[\u0300-\u036f]/g, "")

        // Deixa tudo em letras minúsculas
        .toLowerCase()

        // Tira espaços desnecessários
        .trim()

        // Se tiver vários espaços juntos, deixa só um
        .replace(/\s+/g, " ");

}


// Função que mostra as informações do endereço na tela
function mostrarCampo(rotulo, valor) {

    // Cria um parágrafo
    const linha = document.createElement("p");

    // Cria o título do campo
    const titulo = document.createElement("strong");

    // Coloca o nome do campo
    // Ex: CEP:
    titulo.textContent = `${rotulo}: `;

    // Junta o título com o valor
    // Ex: CEP: 88501-000
    linha.append(
        titulo,
        valor || "Não informado"
    );

    // Coloca essa informação dentro da parte de resultado
    resultado.append(linha);

}


// Função principal que consulta o CEP
async function consultarEndereco() {

    // Esconde o botão do Google Maps enquanto consulta
    linkMaps.hidden = true;


    // Confere se o CEP tem 8 números
    // e se a cidade foi preenchida
    if (!/^\d{8}$/.test(cep) || !cidadeInformada.trim()) {

        // Mostra uma mensagem se os dados estiverem errados
        resultado.textContent =
            "Dados inválidos. Volte e informe CEP e cidade.";

        return;
    }


    // Mostra essa mensagem enquanto o CEP está sendo consultado
    resultado.textContent = "Consultando endereço...";


    // Cria um controle para poder cancelar a consulta
    // caso ela demore muito
    const controle = new AbortController();


    // Define um limite de 10 segundos para a consulta
    const limite = setTimeout(() => {

        controle.abort();

    }, 10000);


    // Aqui começa a tentativa de consultar a API
    try {

        // Faz a consulta do CEP no ViaCEP
        const resposta = await fetch(
            `https://viacep.com.br/ws/${cep}/json/`,
            {
                signal: controle.signal
            }
        );


        // Confere se a resposta da API deu certo
        if (!resposta.ok) {

            throw new Error("Falha HTTP");

        }


        // Pega os dados enviados pela API
        const dados = await resposta.json();


        // Se o CEP não existir, mostra essa mensagem
        if (dados.erro) {

            resultado.textContent =
                "CEP não encontrado.";

            return;
        }


        // Confere se a API trouxe as informações principais
        if (!dados.localidade || !dados.uf || !dados.cep) {

            throw new Error("Resposta incompleta");

        }


        // Compara a cidade que foi digitada
        // com a cidade que veio do ViaCEP
        if (
            normalizar(cidadeInformada) !==
            normalizar(dados.localidade)
        ) {

            // Se forem cidades diferentes,
            // mostra onde o CEP realmente pertence
            resultado.textContent =
                `Este CEP pertence a ${dados.localidade}/${dados.uf}, ` +
                `e não a ${cidadeInformada}. Faça uma nova consulta.`;

            return;
        }


        // Limpa a mensagem "Consultando endereço..."
        resultado.replaceChildren();


        // Lista com todas as informações que queremos mostrar
        const campos = [

            ["CEP", dados.cep],

            ["Logradouro", dados.logradouro],

            ["Complemento", dados.complemento],

            ["Bairro", dados.bairro],

            ["Cidade", dados.localidade],

            ["Estado", dados.estado],

            ["UF", dados.uf]

        ];


        // Mostra todas as informações na tela
        campos.forEach(([rotulo, valor]) => {

            mostrarCampo(rotulo, valor);

        });


        // Junta as informações para formar o endereço completo
        const endereco = [

            dados.logradouro,

            dados.complemento,

            dados.bairro,

            dados.localidade,

            dados.estado,

            dados.uf,

            dados.cep

        ]

        // Tira as informações que estiverem vazias
        .filter(Boolean)

        // Junta tudo usando vírgulas
        .join(", ");


        // Mostra o endereço completo na página
        mostrarCampo(
            "Endereço completo disponível",
            endereco
        );


        // ==================================================
        // GOOGLE MAPS
        // ==================================================

        // Monta a busca usando o CEP que foi digitado
        // junto com a cidade
        const busca = encodeURIComponent(
            `${cep}, ${cidadeInformada}, Brasil`
        );


        // Cria o link que vai abrir o Google Maps
        // pesquisando o CEP e a cidade
        linkMaps.href =
            `https://www.google.com/maps/search/?api=1&query=${busca}`;


        // Depois que o link foi criado,
        // ele aparece na página
        linkMaps.hidden = false;


    } catch (erro) {

        // Se acontecer algum erro na consulta,
        // mostra uma mensagem na tela
        resultado.textContent =
            erro.name === "AbortError"

            ? "A consulta demorou demais. Tente novamente."

            : "Não foi possível consultar. Verifique a conexão e tente novamente.";

    } finally {

        // Cancela o contador dos 10 segundos
        // depois que a consulta termina
        clearTimeout(limite);

    }

}


// Chama a função e começa a consulta
consultarEndereco();