# 🍕 Pizzaria Chalé - Sistema de Gestão de Pedidos & Delivery

Este projeto é uma solução full-stack moderna desenvolvida para automatizar o processo de pedidos de uma pizzaria real. O sistema cobre desde a escolha personalizada do cardápio pelo cliente até o monitoramento em tempo real e impressão de comandas pelo estabelecimento.

---

## 🚀 Demonstração
> https://youtube.com/shorts/5X7gkuWva5Y?feature=share
> https://youtube.com/shorts/0hCtL5YhY3I?feature=share

---

## 💡 Proposta do Projeto
Diferente de um e-commerce comum, esta plataforma foi construída para resolver dores operacionais específicas:
- **Personalização Complexa:** Lógica para pizzas "Meio a Meio", escolha de bordas e tamanhos variados.
- **Eficiência na Cozinha:** Módulo de impressão térmica integrado para gerar comandas instantâneas.
- **Gestão Real-time:** Painel administrativo conectado ao banco de dados para controle de fluxo.

---

## 🛠️ Tecnologias Utilizadas
- **Frontend:** [React 19](https://react.dev/), [TypeScript](https://www.typescriptlang.org/), [Vite](https://vitejs.dev/).
- **Estilização:** [Tailwind CSS](https://tailwindcss.com/) (Interface responsiva e moderna).
- **Backend & Database:** [Supabase](https://supabase.com/) (PostgreSQL + Real-time subscriptions).
- **Ícones:** [Lucide React](https://lucide.dev/).
- **Integração:** API de mensagens via WhatsApp para checkout.

---

## ✅ Mentalidade de Qualidade (QA & Engenharia)
Como entusiasta da área de **Quality Assurance**, o desenvolvimento deste projeto seguiu rigorosos critérios de confiança:
- **Tipagem Estrita:** Uso de TypeScript em 100% das interfaces (`types.ts`) para evitar erros de consistência no carrinho.
- **Validação de Regras de Negócio:** - Cálculo dinâmico de preços baseado no maior valor entre dois sabores.
    - Sistema de cupons com validação de status e limite de uso.
    - Persistência de estado local para prevenir perda de dados em caso de fechamento acidental da aba.
- **Layout de Impressão:** Implementação de regras `@media print` específicas para impressoras térmicas de
