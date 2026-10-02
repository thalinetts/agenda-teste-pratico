# Agenda — Agenda semanal

Tela de agenda semanal em **HTML + CSS + JavaScript puro**, sem build e sem dependências (só a fonte Inter via Google Fonts). Baseada no protótipo do Figma e no `agenda-base.html` do teste.

## Como rodar

Mantenha os três arquivos na mesma pasta e abra o `index.html` no navegador.

```
index.html   estrutura e modais
styles.css   tokens de cor, layout, componentes, modo noturno
app.js       estado em memória, regras de conflito, renderização
```

## O que foi implementado

- Grade semanal (28 Set a 4 Out 2026, 08:00 às 18:00) com dados iniciais inseridos via JS.
- Navegação (Hoje, anterior, próxima), seletor de agenda e botão **Novo Agendamento**.
- Criar, editar e excluir (com confirmação). O card aparece na hora, e a grade pula para a semana do agendamento.
- **Conflito de horário**: células com 2+ agendamentos ativos mostram os cards empilhados com o selo "Conflito de Horário". Ao salvar em um horário ocupado, um modal lista quem já está lá e pergunta se deseja prosseguir.
- Filtros por status (Todos, Confirmados, Pendentes, Cancelados, Conflitos) e busca em tempo real por cliente ou serviço.
- Dashboard com Total, Confirmados, Pendentes e Conflitos ativos, calculado a cada alteração.
- Extras do protótipo: modo noturno (salvo no navegador) e legenda.
- Ícones em SVG inline (estilo Lucide) no lugar dos emojis.

## Decisão de design: como mostrar o conflito

**Decisão:** o conflito aparece em três camadas, e nenhuma depende só de cor.

1. **Na célula:** fundo âmbar suave, selo âmbar com ícone de alerta e borda âmbar em cada card envolvido.
2. **No resumo:** o card "Conflitos ativos" e um aviso na sidebar com o botão "Ver agora", que já aplica o filtro Conflitos.
3. **Na criação:** um modal de confirmação que **lista os agendamentos já existentes** no horário, em vez de um "Já existe um agendamento. Continuar?" genérico.

**Por quê:**

- O âmbar é o único tom quente da paleta (roxo, lima e lilás são frios). Assim o conflito é a primeira coisa que o olho encontra, sem mudar a identidade visual.
- Em vez de bloquear, o sistema **avisa e deixa decidir**: na prática, sobreposição às vezes é intencional (encaixe de urgência), como o caso do Rafael às 11:00.
- Os cards ficam **empilhados**, e não lado a lado, porque cada coluna tem pouco mais de 100px e dois cards lado a lado cortariam nome e serviço.
- Cada status tem também um ícone (check, relógio, X), então a leitura não depende só de cor (acessibilidade para daltonismo).

## Movimento

A regra foi animar só o que responde a uma ação e mostra o que mudou, sem efeitos decorativos soltos.

- **Troca de semana:** a grade desliza na direção da navegação e os cards entram em cascata.
- **Salvar:** o card novo ou editado aparece com um brilho em lima, para você achar onde ele caiu.
- **Excluir:** o card encolhe antes de sumir.
- **Resumo:** os números contam até o valor novo, e o card dá um pequeno pulso quando muda.
- **Conflito:** o ícone de alerta balança algumas vezes ao aparecer, e só nessas vezes.
- **Modais, toast e tema:** entrada com leve mola e saída rápida, o toast mostra o tempo restante, e a troca de tema faz as cores transitarem em vez de piscar.
- **Acessibilidade:** com `prefers-reduced-motion` ativo, todas as animações são desligadas.

## Outras escolhas e suposições

- Agendamentos **cancelados não ocupam o horário**, então não geram conflito.
- Ao **editar** sem mudar dia, horário ou status, o aviso de conflito não aparece de novo.
- Conflito é por **dia e horário**, em qualquer agenda, como no enunciado. O seletor de agenda só filtra a visualização.
- "Dia da semana" no formulário é um campo de **data**, para permitir navegar entre semanas.
- "Hoje" está fixo em 02/10/2026 (constante `TODAY` no `app.js`) para a demonstração cair na semana dos dados. Em produção, troque por `new Date()`.
- Os itens Pacientes, Serviços e Relatórios da sidebar são só visuais (marcados como "Em breve").
- Os modais usam `<dialog>` nativo (foco preso, Esc e leitores de tela sem código extra), e todo texto digitado é escapado antes de ir para o HTML.
