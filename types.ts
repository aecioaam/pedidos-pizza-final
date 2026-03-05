
export interface PizzaSabor {
  name: string;
  ingredients: string;
}

export interface PizzaInOrder {
  id: string;
  type: 'whole' | 'half';
  whole: PizzaSabor | null;
  half1: PizzaSabor | null;
  half2: PizzaSabor | null;
  size: string | null;
  sizePrice: number;
  bordaType: 'normal' | 'recheada';
  bordaPrice: number;
}

export interface BordaInfo {
  type: 'normal' | 'recheada';
  price: number;
}

export interface Refrigerante {
  name: string;
  price: number;
}

export interface CustomerInfo {
  name: string;
  phone: string;
  orderType: 'retirada' | 'entrega';
  rua: string;
  numero: string;
  bairro: string;
  address: string;
  reference: string;
  paymentMethod: 'cartao' | 'dinheiro' | 'pix';
  changeFor: string;
  observations: string;
}

export interface Coupon {
  id: string;
  code: string;
  discount_amount: number;
  max_uses: number;
  used_count: number;
  is_active: boolean;
}

export interface OrderState {
  pizzas: PizzaInOrder[];
  refrigerantes: Refrigerante[];
  customerInfo: CustomerInfo;
  coupon: { code: string; amount: number } | null;
  total: number;
}

export interface Order extends OrderState {
  id: string;
  status: 'pending' | 'accepted' | 'preparing' | 'delivering' | 'completed';
  createdAt: number;
}
