
import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  PizzaSabor,
  OrderState,
  PizzaInOrder,
  Order
} from './types';
import {
  SIZE_OPTIONS,
  BORDA_PRICES,
  DELIVERY_FEE,
  WHATSAPP_NUMBER,
  NOTIFICATION_SOUND
} from './constants';
import { supabase } from './src/supabaseClient';
import {
  ShoppingBag,
  Plus,
  Minus,
  Phone,
  X,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Pizza,
  ReceiptText,
  Trash2,
  ChevronRight,
  ChevronLeft,
  Heart,
  RotateCcw,
  Info,
  Settings,
  LogIn,
  Printer,
  Bell,
  CheckCircle,
  Clock,
  LogOut,
  Store,
  Lock,
  Unlock,
  Save,
  Loader2,
  Pencil,
  TicketPercent,
  CircleDashed,
  Tag,
  Users,
  BarChart3,
  Calendar,
  TrendingUp,
  Clock3,
  Check,
  Edit2
} from 'lucide-react';

const generateId = () => Math.random().toString(36).substr(2, 9);

const createEmptyPizza = (): PizzaInOrder => ({
  id: generateId(),
  type: 'whole',
  whole: null,
  half1: null,
  half2: null,
  size: null,
  sizePrice: 0,
  bordaType: 'normal',
  bordaPrice: 0
});

const initialState: OrderState = {
  pizzas: [createEmptyPizza()],
  refrigerantes: [],
  customerInfo: {
    name: "",
    phone: "",
    orderType: "retirada",
    rua: "",
    numero: "",
    bairro: "",
    address: "",
    reference: "",
    paymentMethod: "cartao",
    changeFor: "",
    observations: ""
  },
  coupon: null,
  total: 0
};

const ImageSequenceHero = ({ imagesCount }: { imagesCount: number }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let images: HTMLImageElement[] = [];
    let loadedImages = 0;

    const drawFrame = (index: number) => {
      const img = images[index];
      if (!img || !img.complete || img.naturalWidth === 0) return;

      const parent = canvas.parentElement;
      if (parent) {
        if (canvas.width !== parent.clientWidth || canvas.height !== parent.clientHeight) {
          canvas.width = parent.clientWidth;
          canvas.height = parent.clientHeight;
        }
      }

      const canvasRatio = canvas.width / canvas.height;
      const imgRatio = img.width / img.height;

      let drawWidth = canvas.width;
      let drawHeight = canvas.height;
      let offsetX = 0;
      let offsetY = 0;

      if (canvasRatio > imgRatio) {
        drawHeight = canvas.width / imgRatio;
        offsetY = (canvas.height - drawHeight) / 2;
      } else {
        drawWidth = canvas.height * imgRatio;
        offsetX = (canvas.width - drawWidth) / 2;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.globalAlpha = 0.5; // Controls the opacity
      ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
    };

    for (let i = 0; i < imagesCount; i++) {
      const img = new Image();
      img.src = `/images/Vídeo_Pronto_Após_Mudança_${i.toString().padStart(3, '0')}.jpg`;
      img.onload = () => {
        loadedImages++;
        if (loadedImages === 1 && i === 0) {
          drawFrame(0);
        }
      };
      images.push(img);
    }

    let frame = 0;
    let animationFrameId: number;
    let lastTime = performance.now();
    const fpsInterval = 1000 / 24; // 24 FPS

    const renderLoop = (time: number) => {
      animationFrameId = requestAnimationFrame(renderLoop);

      const elapsed = time - lastTime;
      if (elapsed > fpsInterval && loadedImages > 0) {
        lastTime = time - (elapsed % fpsInterval);
        frame = (frame + 1) % imagesCount;
        drawFrame(frame);
      }
    };

    animationFrameId = requestAnimationFrame(renderLoop);

    const handleResize = () => drawFrame(frame);
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, [imagesCount]);

  return (
    <div className="absolute inset-0 w-full h-full bg-black overflow-hidden">
      <canvas ref={canvasRef} className="w-full h-full block" />
    </div>
  );
};

export default function App() {
  const [viewMode, setViewMode] = useState<'customer' | 'admin-login' | 'admin-dashboard' | 'landing'>('landing');
  const [step, setStep] = useState(1);
  const [triedToAdvance, setTriedToAdvance] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [order, setOrder] = useState<OrderState>(initialState);
  const [submittedOrderId, setSubmittedOrderId] = useState<string | null>(null);
  const [orderStatus, setOrderStatus] = useState<'pending' | 'accepted' | 'preparing' | 'delivering' | 'completed'>('pending');

  // Admin State
  const [orders, setOrders] = useState<Order[]>([]);
  const [adminUser, setAdminUser] = useState<boolean>(false);
  const [selectedOrderToPrint, setSelectedOrderToPrint] = useState<Order | null>(null);

  // Login State
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [storeSettings, setStoreSettings] = useState({
    isOpen: true,
    closedMessage: 'Estamos fechados no momento. Voltamos em breve!',
    businessHours: 'Sexta a Domingo das 18h às 23h',
    pizzaSizes: SIZE_OPTIONS,
    bordaPrices: BORDA_PRICES,
    deliveryFee: DELIVERY_FEE,
    deliveryNeighborhoods: [
      { name: "Centro", fee: 0 },
      { name: "Castelo Branco", fee: 5 },
      { name: "Fernão Dias", fee: 5 },
      { name: "Santa Quitéria", fee: 5 }
    ],
    pickupDiscountActive: true,
    pickupDiscountValue: 5
  });
  const [isSettingsLoading, setIsSettingsLoading] = useState(true);

  // Menu State
  const [flavorsList, setFlavorsList] = useState<any[]>([]);
  const [beveragesList, setBeveragesList] = useState<any[]>([]);
  const [menuLoading, setMenuLoading] = useState(true);

  // Admin Menu Management State
  const [newFlavor, setNewFlavor] = useState({ name: '', ingredients: '' });
  const [editingFlavor, setEditingFlavor] = useState<number | null>(null);
  const [editFlavorForm, setEditFlavorForm] = useState({ name: '', ingredients: '' });
  const [newBeverage, setNewBeverage] = useState({ name: '', price: '' });
  const [editingBeverage, setEditingBeverage] = useState<number | null>(null);
  const [editBeverageForm, setEditBeverageForm] = useState({ name: '', price: '' });

  // Admin Neighborhoods UI State
  const [newNeighborhood, setNewNeighborhood] = useState({ name: '', fee: '' });
  const [editingNeighborhood, setEditingNeighborhood] = useState<number | null>(null);
  const [editNeighborhoodForm, setEditNeighborhoodForm] = useState({ name: '', fee: '' });

  // Admin Coupons State
  const [couponsList, setCouponsList] = useState<any[]>([]);
  const [newCoupon, setNewCoupon] = useState({ code: '', discount_amount: '', max_uses: '1' });

  // Admin Customers State
  const [customersList, setCustomersList] = useState<any[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [selectedCustomerOrder, setSelectedCustomerOrder] = useState<Order | null>(null);
  const [selectedHistoryOrder, setSelectedHistoryOrder] = useState<Order | null>(null);

  // Customer Coupon State
  const [couponCodeInput, setCouponCodeInput] = useState('');
  const [couponError, setCouponError] = useState('');
  const [couponSuccess, setCouponSuccess] = useState('');

  // Admin Tabs
  const [activeTab, setActiveTab] = useState<'orders' | 'menu' | 'system' | 'prices' | 'coupons' | 'customers' | 'analytics'>('orders');
  const [analyticsPeriod, setAnalyticsPeriod] = useState<'today' | '7days' | '30days' | 'all'>('7days');

  const deliveryFee = useMemo(() => {
    if (order.customerInfo.orderType !== 'entrega' || !order.customerInfo.bairro) return 0;
    const bairroObj = storeSettings.deliveryNeighborhoods?.find((n: any) => n.name === order.customerInfo.bairro);
    return bairroObj ? Number(bairroObj.fee) : 0;
  }, [order.customerInfo.orderType, order.customerInfo.bairro, storeSettings.deliveryNeighborhoods]);
  const [pixCopied, setPixCopied] = useState(false);

  const lastOrderCount = useRef(0);
  const notificationAudio = useRef<HTMLAudioElement | null>(null);

  // Load and save orders from LocalStorage
  // Load and subscribe to orders from Supabase
  useEffect(() => {
    // Carregar pedidos iniciais
    const fetchOrders = async () => {
      const { data } = await supabase.from('orders').select('content');
      if (data) {
        const loadedOrders = data.map((row: any) => row.content);
        setOrders(loadedOrders);
        lastOrderCount.current = loadedOrders.length;
      }
    };
    fetchOrders();

    // Monitoramento Realtime
    const channel = supabase
      .channel('realtime_orders')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'orders' },
        (payload) => {
          const newOrder = payload.new.content as Order;
          setOrders(prev => {
            if (prev.some(o => o.id === newOrder.id)) return prev;
            return [...prev, newOrder];
          });
        }
      )
      .subscribe();

    // Auth State Listener
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setAdminUser(true);
        setViewMode('admin-dashboard');
      } else {
        setAdminUser(false);
        // Only switch to customer view if currently in dashboard, to allow login screen access
        // But for simplicity/logic flow:
        if (viewMode === 'admin-dashboard') {
          setViewMode('customer');
        }
      }
    });

    // Init notification sound
    notificationAudio.current = new Audio(NOTIFICATION_SOUND);
    notificationAudio.current.volume = 1.0;

    return () => {
      supabase.removeChannel(channel);
      authListener.subscription.unsubscribe();
    };
  }, []);

  // Customer Realtime Tracking
  useEffect(() => {
    // Restore tracking from localStorage
    const savedTrackerId = localStorage.getItem('chalé_tracking_order_id');
    if (!submittedOrderId && savedTrackerId) {
      setSubmittedOrderId(savedTrackerId);
    }

    if (!submittedOrderId) return;

    // Fetch initial status just in case it changed while away
    const fetchInitialStatus = async () => {
      const { data } = await supabase.from('orders').select('content').eq('content->>id', submittedOrderId).single();
      if (data && data.content) {
        setOrderStatus((data.content as Order).status);
      }
    };
    fetchInitialStatus();

    const channel = supabase
      .channel(`customer_order_${submittedOrderId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'orders' },
        (payload) => {
          const updatedOrder = payload.new.content as Order;
          if (updatedOrder.id === submittedOrderId) {
            setOrderStatus(updatedOrder.status);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [submittedOrderId]);

  // Fetch customers when tab is active
  useEffect(() => {
    if (activeTab === 'customers') {
      const fetchCustomers = async () => {
        const { data, error } = await supabase.from('customers').select('*').order('last_order_date', { ascending: false });
        if (data) {
          setCustomersList(data);
        }
        if (error) {
          console.error("Error fetching customers. Table might not exist:", error);
        }
      };
      fetchCustomers();
    }
  }, [activeTab, adminUser]);

  useEffect(() => {
    // Fetch initial store settings
    const fetchSettings = async () => {
      const { data } = await supabase.from('store_settings').select('*').eq('id', 1).single();
      if (data) {
        setStoreSettings({
          isOpen: data.is_open,
          closedMessage: data.closed_message,
          businessHours: data.business_hours || 'Sexta a Domingo das 18h às 23h',
          pizzaSizes: (data.pizza_sizes && data.pizza_sizes.length > 0) ? data.pizza_sizes : SIZE_OPTIONS,
          bordaPrices: data.borda_prices || BORDA_PRICES,
          deliveryFee: data.delivery_fee !== null ? Number(data.delivery_fee) : DELIVERY_FEE,
          deliveryNeighborhoods: data.delivery_neighborhoods || [
            { name: "Centro", fee: 0 },
            { name: "Castelo Branco", fee: 5 },
            { name: "Fernão Dias", fee: 5 },
            { name: "Santa Quitéria", fee: 5 }
          ],
          pickupDiscountActive: data.pickup_discount_active ?? true,
          pickupDiscountValue: data.pickup_discount_value ?? 5
        });
      }
      setIsSettingsLoading(false);
    };
    fetchSettings();

    // Store Settings Realtime
    const settingsChannel = supabase
      .channel('store_settings_changes')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'store_settings', filter: 'id=eq.1' },
        (payload) => {
          const newData = payload.new;
          setStoreSettings({
            isOpen: newData.is_open,
            closedMessage: newData.closed_message,
            businessHours: newData.business_hours || 'Sexta a Domingo das 18h às 23h',
            pizzaSizes: (newData.pizza_sizes && newData.pizza_sizes.length > 0) ? newData.pizza_sizes : SIZE_OPTIONS,
            bordaPrices: newData.borda_prices || BORDA_PRICES,
            deliveryFee: newData.delivery_fee !== null ? Number(newData.delivery_fee) : DELIVERY_FEE,
            deliveryNeighborhoods: newData.delivery_neighborhoods || [
              { name: "Centro", fee: 0 },
              { name: "Castelo Branco", fee: 5 },
              { name: "Fernão Dias", fee: 5 },
              { name: "Santa Quitéria", fee: 5 }
            ],
            pickupDiscountActive: newData.pickup_discount_active ?? true,
            pickupDiscountValue: newData.pickup_discount_value ?? 5
          });
        }
      )
      .subscribe();

    // Coupons Realtime
    const couponsChannel = supabase
      .channel('realtime_coupons')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'coupons' },
        (payload) => {
          setCouponsList((prev) => {
            if (payload.eventType === 'INSERT') {
              // Previne duplicatas se a própria janela inseriu
              if (prev.some(c => c.id === payload.new.id)) return prev;
              return [payload.new, ...prev];
            }
            if (payload.eventType === 'UPDATE') {
              return prev.map(c => c.id === payload.new.id ? payload.new : c);
            }
            if (payload.eventType === 'DELETE') {
              return prev.filter(c => c.id !== payload.old.id);
            }
            return prev;
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(settingsChannel);
      supabase.removeChannel(couponsChannel);
    }
  }, []);

  useEffect(() => {
    const fetchMenu = async () => {
      try {
        setMenuLoading(true);

        // Fetch Flavors
        const { data: flavors, error: flavorsError } = await supabase
          .from('pizza_flavors')
          .select('*')
          .order('name');

        if (flavorsError) throw flavorsError;
        if (flavors) setFlavorsList(flavors);

        // Fetch Beverages
        const { data: beverages, error: beveragesError } = await supabase
          .from('beverages')
          .select('*')
          .order('name');

        if (beveragesError) throw beveragesError;
        if (beverages) setBeveragesList(beverages);

        // Fetch Coupons
        const { data: coupons, error: couponsError } = await supabase
          .from('coupons')
          .select('*')
          .order('created_at', { ascending: false });

        if (couponsError) throw couponsError;
        if (coupons) setCouponsList(coupons);

      } catch (error) {
        console.error('Erro ao carregar cardápio:', error);
      } finally {
        setMenuLoading(false);
      }
    };

    fetchMenu();
  }, []);

  useEffect(() => {
    // localStorage.setItem('chalé_orders', JSON.stringify(orders)); // Removido persistência local

    // Play sound if new order arrives
    if (orders.length > lastOrderCount.current) {
      const latestOrder = orders[orders.length - 1];
      if (latestOrder.status === 'pending') {
        const playSound = () => {
          if (notificationAudio.current) {
            notificationAudio.current.currentTime = 0;
            notificationAudio.current.play().catch(e => console.log("Audio play blocked"));
          }
        };

        // Play 3 times
        playSound();
        setTimeout(playSound, 1000);
        setTimeout(playSound, 2000);
      }
    }
    lastOrderCount.current = orders.length;
  }, [orders]);

  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean;
    pizzaId: string;
    type: 'whole' | 'half';
    halfNum: 1 | 2 | null;
  }>({
    isOpen: false,
    pizzaId: '',
    type: 'whole',
    halfNum: null
  });

  const [whatsappModalOpen, setWhatsappModalOpen] = useState(false);

  const withdrawalDiscount = useMemo(() => {
    if (!storeSettings.pickupDiscountActive) return 0;
    if (order.customerInfo.orderType !== 'retirada') return 0;

    let discount = 0;
    order.pizzas.forEach(p => {
      // Regra: Desconto de R$ 5,00 para pizzas M, G ou GG na retirada
      // Se for "P" (Pequena), NÃO tem desconto.
      if (p.size && p.size !== 'P') {
        discount += storeSettings.pickupDiscountValue || 5;
      }
    });
    return discount;
  }, [order.pizzas, order.customerInfo.orderType, storeSettings.pickupDiscountActive, storeSettings.pickupDiscountValue]);

  const currentTotal = useMemo(() => {
    let subtotal = 0;
    order.pizzas.forEach(p => {
      subtotal += p.sizePrice + p.bordaPrice;
    });
    order.refrigerantes.forEach(r => subtotal += r.price);

    if (order.customerInfo.orderType === 'entrega') {
      subtotal += deliveryFee;
    } else {
      subtotal -= withdrawalDiscount;
    }

    if (order.coupon) {
      subtotal -= order.coupon.amount;
    }

    // Garantir que não fique negativo (embora improvável com essas regras)
    return Math.max(0, subtotal);
  }, [order.pizzas, order.refrigerantes, order.customerInfo.orderType, deliveryFee, withdrawalDiscount, order.coupon]);

  useEffect(() => {
    setOrder(prev => ({ ...prev, total: currentTotal }));
  }, [currentTotal]);

  const addPizza = () => {
    setOrder(prev => ({ ...prev, pizzas: [...prev.pizzas, createEmptyPizza()] }));
  };

  const removePizza = (id: string) => {
    if (order.pizzas.length > 1) {
      setOrder(prev => ({ ...prev, pizzas: prev.pizzas.filter(p => p.id !== id) }));
    }
  };

  const updatePizza = (id: string, updates: Partial<PizzaInOrder>) => {
    setOrder(prev => ({
      ...prev,
      pizzas: prev.pizzas.map(p => p.id === id ? { ...p, ...updates } : p)
    }));
  };

  const selectSabor = (sabor: PizzaSabor) => {
    const { pizzaId, type, halfNum } = modalConfig;
    const pizza = order.pizzas.find(p => p.id === pizzaId);
    if (!pizza) return;

    if (type === 'whole') {
      updatePizza(pizzaId, { whole: sabor });
    } else {
      if (halfNum === 1) {
        if (pizza.half2?.name === sabor.name) {
          alert("⚠️ Escolha um sabor diferente para a outra metade.");
          return;
        }
        updatePizza(pizzaId, { half1: sabor });
      } else {
        if (pizza.half1?.name === sabor.name) {
          alert("⚠️ Escolha um sabor diferente para a outra metade.");
          return;
        }
        updatePizza(pizzaId, { half2: sabor });
      }
    }
    setModalConfig(prev => ({ ...prev, isOpen: false }));
  };

  const handleNextStep = () => {
    setTriedToAdvance(true);

    if (step === 1) {
      const hasIncompletePizza = order.pizzas.some(p =>
        !p.size ||
        (p.type === 'whole' && !p.whole) ||
        (p.type === 'half' && (!p.half1 || !p.half2))
      );
      if (hasIncompletePizza) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
    }

    if (step === 3) {
      const info = order.customerInfo;
      const isNameMissing = !info.name.trim();
      const isPhoneMissing = info.phone.replace(/\D/g, '').length < 10;
      const isDeliveryAddressMissing = info.orderType === 'entrega' && (!info.rua.trim() || !info.numero.trim() || !info.bairro.trim());

      if (isNameMissing || isPhoneMissing || isDeliveryAddressMissing) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
    }

    setTriedToAdvance(false);
    setStep(s => Math.min(s + 1, 4));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackStep = () => {
    setTriedToAdvance(false);
    setStep(s => Math.max(s - 1, 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleReset = () => {
    setOrder(initialState);
    setStep(1);
    setIsFinished(false);
    setTriedToAdvance(false);
    setWhatsappModalOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const closeTracker = () => {
    setIsFinished(false);
    setOrder(initialState);
    setStep(1);
  };

  const saveOrderLocally = async () => {
    const newOrder: Order = {
      ...order,
      id: generateId(),
      status: 'pending',
      createdAt: Date.now()
    };

    // Atualiza uso do cupom se existir
    if (newOrder.coupon) {
      const { data } = await supabase.from('coupons').select('used_count').eq('code', newOrder.coupon.code).single();
      if (data) {
        await supabase.from('coupons').update({ used_count: data.used_count + 1 }).eq('code', newOrder.coupon.code);
      }
    }

    // Salvar cliente no LocalStorage e Supabase
    const cleanPhone = newOrder.customerInfo.phone.replace(/\D/g, '');
    if (cleanPhone.length >= 10) {
      const { name, rua, numero, bairro, reference } = newOrder.customerInfo;
      localStorage.setItem('pizza_customer_' + cleanPhone, JSON.stringify({ name, rua, numero, bairro, reference }));

      try {
        const { data: existingCustomer } = await supabase.from('customers').select('*').eq('phone', cleanPhone).single();

        if (existingCustomer) {
          await supabase.from('customers').update({
            name, rua, numero, bairro, reference,
            total_orders: existingCustomer.total_orders + 1,
            last_order_date: new Date().toISOString()
          }).eq('phone', cleanPhone);
        } else {
          await supabase.from('customers').insert([{
            phone: cleanPhone,
            name, rua, numero, bairro, reference,
            total_orders: 1,
            last_order_date: new Date().toISOString()
          }]);
        }
      } catch (err) {
        console.error("Erro ao salvar cliente no supabase. Tabela pode não existir:", err);
      }
    }

    // Salvar no Supabase
    await supabase.from('orders').insert([{ content: newOrder }]);

    setOrders(prev => [...prev, newOrder]);
    setOrderStatus('pending');
    setSubmittedOrderId(newOrder.id);
    localStorage.setItem('chalé_tracking_order_id', newOrder.id);
  };

  const generateWhatsAppMessage = () => {
    const o = order;
    const info = o.customerInfo;
    let msg = `*NOVO PEDIDO - PIZZARIA CHALÉ*\n\n`;
    msg += `*Cliente:* ${info.name}\n`;
    msg += `*Telefone:* ${info.phone}\n`;
    msg += `*Tipo:* ${info.orderType === 'retirada' ? 'Retirada' : 'Entrega'}\n`;

    if (info.orderType === 'entrega') {
      msg += `*Endereço:* ${info.rua}, ${info.numero} - ${info.bairro}\n`;
      if (info.reference.trim()) msg += `*Referência:* ${info.reference}\n`;
    }

    msg += `*Pagamento:* ${info.paymentMethod.toUpperCase()}\n`;
    if (info.paymentMethod === 'dinheiro') msg += `*Troco:* ${info.changeFor}\n`;

    msg += `\n*ÍTENS:*\n`;
    o.pizzas.forEach((p, i) => {
      msg += `Pizza ${i + 1} (${p.size}): ${p.type === 'whole' ? p.whole?.name : `${p.half1?.name} / ${p.half2?.name}`}\n`;
      msg += `Borda: ${p.bordaType === 'normal' ? 'Simples' : 'Recheada'}\n\n`;
    });

    if (o.refrigerantes.length > 0) {
      msg += `*Bebidas:*\n`;
      o.refrigerantes.forEach(r => msg += `- ${r.name}\n`);
    }

    if (info.observations.trim()) {
      msg += `\n*Obs:* ${info.observations}\n`;
    }

    if (o.coupon) {
      msg += `\n🎫 *Cupom de Desconto* (-R$ ${o.coupon.amount.toFixed(2).replace('.', ',')})`;
    }

    msg += `\n*Total: R$ ${o.total.toFixed(2).replace('.', ',')}*`;
    return `https://api.whatsapp.com/send?phone=${WHATSAPP_NUMBER}&text=${encodeURIComponent(msg)}`;
  };

  // Admin Actions
  const handleAdminLogin = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        alert("Erro no login: " + error.message);
      }
      // Success is handled by onAuthStateChange
    } catch (error) {
      alert("Erro inesperado ao fazer login");
    } finally {
      setLoading(false);
    }
  };

  const handleAdminLogout = async () => {
    await supabase.auth.signOut();
    setAdminUser(false);
    setViewMode('customer');
  };

  const deleteOrder = async (id: string) => {
    if (confirm("Deseja realmente excluir este pedido?")) {
      await supabase.from('orders').delete().ilike('content->>id', id); // Remove do banco
      setOrders(prev => prev.filter(o => o.id !== id));
    }
  };

  const changeOrderStatus = async (id: string, newStatus: Order['status']) => {
    const orderToUpdate = orders.find(o => o.id === id);
    if (orderToUpdate) {
      const updated = { ...orderToUpdate, status: newStatus };
      await supabase.from('orders').update({ content: updated }).eq('content->>id', id);
      setOrders(prev => prev.map(o => o.id === id ? updated : o));
    }
  };

  const printOrder = (targetOrder: Order) => {
    const printArea = document.getElementById('print-area');
    if (!printArea) return;

    const info = targetOrder.customerInfo;
    const date = new Date(targetOrder.createdAt).toLocaleString();

    // Group beverages by name for cleaner display
    const beveragesGrouped = targetOrder.refrigerantes.reduce((acc, curr) => {
      acc[curr.name] = (acc[curr.name] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    let html = `
      <div style="font-family: sans-serif; color: #000;">
        <!-- CABEÇALHO (ENTREGA) -->
        <div style="text-align: center; margin-bottom: 10px;">
          <h1 style="margin: 0; font-size: 20px; font-weight: 900; line-height: 1.1;">${info.name}</h1>
          <div style="font-size: 12px; font-weight: bold; margin-top: 2px;">${info.phone || ''}</div>
          ${info.orderType === 'entrega' ? `
            <div style="margin-top: 6px; font-size: 13px; font-weight: 700; line-height: 1.3;">
              ${info.rua}, ${info.numero}
              <br/>${info.bairro}
            </div>
            ${info.reference ? `<div style="font-size: 11px; margin-top: 2px;">(Ref: ${info.reference})</div>` : ''}
          ` : `
            <div style="margin-top: 8px; font-size: 14px; font-weight: 800; border: 2px solid #000; display: inline-block; padding: 2px 6px; letter-spacing: 0.5px;">RETIRADA</div>
          `}
          
          <div style="margin-top: 8px; border-top: 1px solid #000; padding-top: 4px; display: flex; justify-content: space-between; font-size: 10px;">
            <span>#${targetOrder.id.substring(0, 6).toUpperCase()}</span>
            <span>${date}</span>
          </div>
        </div>

        <div style="border-bottom: 2px dashed #000; margin: 10px 0;"></div>

        <!-- CORPO (COZINHA) -->
        <div style="margin-bottom: 10px;">
          ${targetOrder.pizzas.map((p, i) => `
            <div style="margin-bottom: 12px; padding-bottom: 8px; border-bottom: 1px dotted #ccc;">
              <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px;">
                <span style="font-size: 14px; font-weight: 900; background: #000; color: #fff; padding: 1px 6px; border-radius: 2px;">${p.size || 'ND'}</span>
                ${p.bordaType === 'recheada' ? `<span style="font-size: 10px; font-weight: 700; border: 1px solid #000; padding: 0 4px;">BORDA RECHEADA</span>` : ''}
              </div>
              
              <div style="font-size: 13px; font-weight: 800; line-height: 1.3; margin-left: 2px;">
                ${p.type === 'whole'
        ? `<div style="margin-bottom: 2px;">• ${p.whole?.name || 'Sabor não escolhido'}</div>`
        : `<div style="margin-bottom: 2px;">• 1/2 ${p.half1?.name || '...'}</div><div>• 1/2 ${p.half2?.name || '...'}</div>`
      }
              </div>
            </div>
          `).join('')}


          ${/* OBSERVATIONS (First for Kitchen) */ ''}
          ${info.observations.trim() ? `
            <div style="margin-top: 12px; border: 2px solid #000; padding: 6px;">
              <div style="font-size: 9px; font-weight: 700; text-transform: uppercase; margin-bottom: 2px;">OBSERVAÇÕES:</div>
              <div style="font-size: 12px; font-weight: 900; text-transform: uppercase;">
                ${info.observations}
              </div>
            </div>
          ` : ''}

          ${/* BEVERAGES */ ''}
          ${Object.entries(beveragesGrouped).length > 0 ? `
            <div style="margin-top: 6px; padding-top: 4px; border-top: 1px dashed #000;">
              ${Object.entries(beveragesGrouped).map(([name, qty]) => `
                <div style="font-size: 13px; font-weight: 800; margin-bottom: 2px;">
                  ${qty}x ${name}
                </div>
              `).join('')}
            </div>
          ` : ''}
        </div>

      <!-- RODAPÉ (FINANCEIRO) -->
        <div style="margin-top: 15px; text-align: right; font-size: 11px; border-top: 1px solid #000; padding-top: 8px;">
          <div style="margin-bottom: 2px;">
            Pagamento: <span>${info.paymentMethod.toUpperCase()}</span>
            ${info.paymentMethod === 'dinheiro' && info.changeFor ? ` (Troco para ${info.changeFor})` : ''}
          </div>
          
          ${(() => {
        let printDiscount = 0;
        if (storeSettings.pickupDiscountActive && info.orderType === 'retirada') {
          targetOrder.pizzas.forEach(p => {
            if (p.size && p.size !== 'P') {
              printDiscount += storeSettings.pickupDiscountValue || 5;
            }
          });
        }
        if (printDiscount > 0) {
          return `
                <div style="margin-bottom: 2px; font-weight: bold;">
                  Desconto Retirada: - R$ ${printDiscount.toFixed(2).replace('.', ',')}
                </div>
              `;
        }
        return '';
      })()}

          <div style="font-size: 12px; font-weight: bold;">
            Total: R$ ${targetOrder.total.toFixed(2).replace('.', ',')}
          </div>
          ${info.orderType === 'entrega' ? `<div style="font-size: 9px;">(Taxa inclusa)</div>` : ''}
        </div>
      </div>
    `;

    printArea.innerHTML = html;
    window.print();
  };

  // ADMIN DASHBOARD VIEW
  if (viewMode === 'admin-dashboard' && adminUser) {
    const pendingOrders = orders.filter(o => o.status !== 'completed').sort((a, b) => b.createdAt - a.createdAt);
    const completedOrders = orders.filter(o => o.status === 'completed').sort((a, b) => b.createdAt - a.createdAt);

    return (
      <div className="min-h-screen bg-stone-100 flex flex-col">
        <header className="bg-stone-800 text-white p-4 md:p-6 shadow-md flex flex-col md:flex-row justify-between items-center gap-4 no-print">
          <div className="flex items-center gap-4 w-full md:w-auto justify-center md:justify-start">
            <div className="bg-rose-600 p-2 rounded-xl">
              <Settings className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-serif font-bold">Painel de Pedidos</h1>
              <p className="text-[10px] text-stone-400 font-bold uppercase tracking-widest">Chalé Pizzaria</p>
            </div>
          </div>
          <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
            <div className={`flex items-center gap-2 px-3 py-1 rounded-full border ${storeSettings.isOpen ? 'bg-green-500/20 border-green-500/30 text-green-700' : 'bg-red-500/20 border-red-500/30 text-red-700'}`}>
              <span className={`w-2 h-2 rounded-full ${storeSettings.isOpen ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></span>
              <span className="text-[10px] font-bold uppercase">{storeSettings.isOpen ? 'Online' : 'Offline'}</span>
            </div>
            <button onClick={handleAdminLogout} className="p-2 hover:bg-stone-700 rounded-lg transition-colors text-stone-300">
              <LogOut size={20} />
            </button>
          </div>
        </header >

        {/* TAB NAVIGATION */}
        < div className="bg-white border-b border-stone-200 px-4 md:px-6 no-print overflow-hidden" >
          <div className="max-w-7xl mx-auto flex gap-4 md:gap-6 overflow-x-auto custom-scrollbar pb-2 md:pb-0">
            <button
              onClick={() => setActiveTab('orders')}
              className={`whitespace-nowrap py-4 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${activeTab === 'orders' ? 'border-rose-600 text-rose-600' : 'border-transparent text-stone-500 hover:text-stone-800'}`}
            >
              <ReceiptText size={18} /> Pedidos
            </button>
            <button
              onClick={() => setActiveTab('menu')}
              className={`whitespace-nowrap py-4 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${activeTab === 'menu' ? 'border-rose-600 text-rose-600' : 'border-transparent text-stone-500 hover:text-stone-800'}`}
            >
              <Pizza size={18} /> Cardápio
            </button>
            <button
              onClick={() => setActiveTab('coupons')}
              className={`whitespace-nowrap py-4 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${activeTab === 'coupons' ? 'border-rose-600 text-rose-600' : 'border-transparent text-stone-500 hover:text-stone-800'}`}
            >
              <TicketPercent size={18} /> Cupons
            </button>
            <button
              onClick={() => setActiveTab('system')}
              className={`whitespace-nowrap py-4 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${activeTab === 'system' ? 'border-rose-600 text-rose-600' : 'border-transparent text-stone-500 hover:text-stone-800'}`}
            >
              <Settings size={18} /> Configurações
            </button>
            <button
              onClick={() => setActiveTab('prices')}
              className={`whitespace-nowrap py-4 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${activeTab === 'prices' ? 'border-rose-600 text-rose-600' : 'border-transparent text-stone-500 hover:text-stone-800'}`}
            >
              <ReceiptText size={18} /> Preços e Taxas
            </button>
            <button
              onClick={() => setActiveTab('customers')}
              className={`whitespace-nowrap py-4 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${activeTab === 'customers' ? 'border-rose-600 text-rose-600' : 'border-transparent text-stone-500 hover:text-stone-800'}`}
            >
              <Users size={18} /> Clientes
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`whitespace-nowrap py-4 text-sm font-bold border-b-2 transition-all flex items-center gap-2 ${activeTab === 'analytics' ? 'border-rose-600 text-rose-600' : 'border-transparent text-stone-500 hover:text-stone-800'}`}
            >
              <BarChart3 size={18} /> Análise
            </button>
          </div>
        </div >

        {/* STORE SETTINGS TAB - SYSTEM */}
        {
          activeTab === 'system' && (
            <div className="bg-stone-50 p-6 border-b border-stone-200 no-print animate-in fade-in slide-in-from-left-4 duration-300">
              <div className="max-w-7xl mx-auto space-y-6">

                <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-stone-100 mb-6">
                  <h2 className="text-xl font-serif font-bold text-stone-800 flex items-center gap-2">
                    <Settings size={24} className="text-stone-400" />
                    Configurações do Sistema
                  </h2>
                  <button
                    onClick={async () => {
                      await supabase.from('store_settings').update({
                        closed_message: storeSettings.closedMessage,
                        business_hours: storeSettings.businessHours,
                        pizza_sizes: storeSettings.pizzaSizes,
                        borda_prices: storeSettings.bordaPrices,
                        delivery_fee: storeSettings.deliveryFee,
                        delivery_neighborhoods: storeSettings.deliveryNeighborhoods,
                        pickup_discount_active: storeSettings.pickupDiscountActive,
                        pickup_discount_value: storeSettings.pickupDiscountValue
                      }).eq('id', 1);
                      alert('Configurações do Sistema salvas com sucesso!');
                    }}
                    className="px-6 py-2.5 bg-stone-800 text-white font-bold rounded-xl hover:bg-stone-700 transition-colors flex items-center gap-2 shadow-sm"
                  >
                    <Save size={18} /> Salvar Tudo
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                  {/* STATUS DA LOJA */}
                  <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-stone-100 flex flex-col">
                    <h3 className="font-bold text-lg text-stone-700 mb-4 flex items-center gap-2">
                      <Store size={20} className="text-stone-500" /> Status da Loja
                    </h3>
                    <div className="flex-1 flex flex-col justify-center gap-4">
                      <button
                        onClick={async () => {
                          const newState = !storeSettings.isOpen;
                          await supabase.from('store_settings').update({ is_open: newState }).eq('id', 1);
                          setStoreSettings(prev => ({ ...prev, isOpen: newState }));
                        }}
                        className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-3 transition-all ${storeSettings.isOpen ? 'bg-red-500 text-white hover:bg-red-600 shadow-md shadow-red-200' : 'bg-green-500 text-white hover:bg-green-600 shadow-md shadow-green-200'}`}
                      >
                        {storeSettings.isOpen ? <><Lock size={20} /> FECHAR LOJA</> : <><Unlock size={20} /> ABRIR LOJA</>}
                      </button>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-stone-500">Mensagem (Quando fechado)</label>
                        <input
                          type="text"
                          value={storeSettings.closedMessage}
                          onChange={(e) => setStoreSettings(prev => ({ ...prev, closedMessage: e.target.value }))}
                          className="w-full px-4 py-3 rounded-xl border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-200"
                          placeholder="Estamos fechados no momento..."
                        />
                      </div>
                    </div>
                  </div>

                  {/* HORÁRIOS */}
                  <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-stone-100 flex flex-col">
                    <h3 className="font-bold text-lg text-stone-700 mb-4 flex items-center gap-2">
                      <Clock size={20} className="text-stone-500" /> Expediente
                    </h3>
                    <div className="flex-1 space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-stone-500">Horário de Funcionamento</label>
                      <textarea
                        value={storeSettings.businessHours}
                        onChange={(e) => setStoreSettings(prev => ({ ...prev, businessHours: e.target.value }))}
                        className="w-full px-4 py-3 rounded-xl border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-200 min-h-[100px] resize-none"
                        placeholder="Terça a Domingo..."
                      />
                    </div>
                  </div>

                  {/* PROMOÇÕES */}
                  <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-stone-100 flex flex-col">
                    <h3 className="font-bold text-lg text-stone-700 mb-4 flex items-center gap-2">
                      <Tag size={20} className="text-rose-500" /> Promoções
                    </h3>
                    <div className="flex-1 flex flex-col justify-center bg-stone-50 rounded-xl p-4 border border-stone-100">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-bold text-stone-700 text-sm">Desconto na Retirada</h4>
                        <button
                          onClick={async () => {
                            const newState = !storeSettings.pickupDiscountActive;
                            await supabase.from('store_settings').update({ pickup_discount_active: newState }).eq('id', 1);
                            setStoreSettings(prev => ({ ...prev, pickupDiscountActive: newState }));
                          }}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${storeSettings.pickupDiscountActive ? 'bg-green-500' : 'bg-stone-300'}`}
                        >
                          <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${storeSettings.pickupDiscountActive ? 'translate-x-6' : 'translate-x-1'}`} />
                        </button>
                      </div>
                      <div className="mt-4 flex items-center justify-between gap-4 bg-white p-3 rounded-xl border border-stone-200">
                        <span className="text-sm font-bold text-stone-600">Valor do Desconto:</span>
                        <div className="relative w-32">
                          <span className="absolute left-3 top-2.5 text-stone-400 text-sm">R$</span>
                          <input
                            type="text"
                            value={storeSettings.pickupDiscountValue || storeSettings.pickupDiscountValue === 0 ? Number(storeSettings.pickupDiscountValue).toFixed(2) : ''}
                            onChange={e => {
                              const valStr = e.target.value.replace(/\D/g, '');
                              const val = valStr ? parseFloat(valStr) / 100 : 0;
                              setStoreSettings(prev => ({ ...prev, pickupDiscountValue: val }));
                            }}
                            disabled={!storeSettings.pickupDiscountActive}
                            className={`w-full pl-8 pr-4 py-2 bg-stone-50 border border-stone-200 rounded-lg outline-none focus:ring-2 focus:ring-rose-200 font-medium ${!storeSettings.pickupDiscountActive ? 'opacity-50 cursor-not-allowed' : ''}`}
                          />
                        </div>
                      </div>
                      <p className="text-xs text-stone-500 leading-relaxed mt-3">
                        Desconto automático aplicado para pedidos nas categorias M, G e GG na modalidade Retirada.
                      </p>
                    </div>
                  </div>

                </div>
              </div>
            </div>
          )
        }

        {/* STORE SETTINGS TAB - PRICES AND FEES */}
        {
          activeTab === 'prices' && (
            <div className="bg-stone-50 p-6 border-b border-stone-200 no-print animate-in fade-in slide-in-from-left-4 duration-300">
              <div className="max-w-7xl mx-auto space-y-6">

                <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-stone-100 mb-6">
                  <h2 className="text-xl font-serif font-bold text-stone-800 flex items-center gap-2">
                    <ReceiptText size={24} className="text-stone-400" />
                    Preços e Taxas
                  </h2>
                  <button
                    onClick={async () => {
                      await supabase.from('store_settings').update({
                        closed_message: storeSettings.closedMessage,
                        business_hours: storeSettings.businessHours,
                        pizza_sizes: storeSettings.pizzaSizes,
                        borda_prices: storeSettings.bordaPrices,
                        delivery_fee: storeSettings.deliveryFee,
                        delivery_neighborhoods: storeSettings.deliveryNeighborhoods,
                        pickup_discount_active: storeSettings.pickupDiscountActive,
                        pickup_discount_value: storeSettings.pickupDiscountValue
                      }).eq('id', 1);
                      alert('Preços e Taxas salvos com sucesso!');
                    }}
                    className="px-6 py-2.5 bg-stone-800 text-white font-bold rounded-xl hover:bg-stone-700 transition-colors flex items-center gap-2 shadow-sm"
                  >
                    <Save size={18} /> Salvar Tudo
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                  {/* PREÇOS DE PIZZAS */}
                  <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-stone-100">
                    <h4 className="font-bold text-stone-700 mb-4 flex items-center gap-2">
                      <Pizza size={18} className="text-stone-400" /> Tamanhos
                    </h4>
                    <div className="space-y-3 flex flex-col gap-2">
                      {((storeSettings.pizzaSizes && storeSettings.pizzaSizes.length > 0) ? storeSettings.pizzaSizes : SIZE_OPTIONS).map((opt: any, idx: number) => (
                        <div key={idx} className="flex flex-col gap-3 bg-stone-50 p-4 rounded-xl border border-stone-100 relative group">
                          <button
                            onClick={() => {
                              const newSizes = [...storeSettings.pizzaSizes];
                              newSizes.splice(idx, 1);
                              setStoreSettings(prev => ({ ...prev, pizzaSizes: newSizes }));
                            }}
                            className="absolute top-2 right-2 p-1.5 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                            title="Remover tamanho"
                          >
                            <Trash2 size={16} />
                          </button>
                          <div className="flex items-center gap-3 pr-8">
                            <input
                              type="text"
                              value={opt.size}
                              onChange={e => {
                                const newSizes = [...storeSettings.pizzaSizes];
                                newSizes[idx] = { ...newSizes[idx], size: e.target.value };
                                setStoreSettings(prev => ({ ...prev, pizzaSizes: newSizes }));
                              }}
                              className="w-16 font-black text-stone-800 text-center text-lg bg-transparent outline-none border-b-2 border-stone-200 focus:border-rose-400 transition-colors uppercase"
                              placeholder="Nome"
                            />
                            <div className="relative flex-1">
                              <span className="absolute left-3 top-2.5 text-stone-400 text-sm">R$</span>
                              <input
                                type="text"
                                value={opt.price || opt.price === 0 ? Number(opt.price).toFixed(2) : ''}
                                onChange={e => {
                                  const valStr = e.target.value.replace(/\D/g, '');
                                  const val = valStr ? parseFloat(valStr) / 100 : 0;
                                  const newSizes = [...storeSettings.pizzaSizes];
                                  newSizes[idx] = { ...newSizes[idx], price: val };
                                  setStoreSettings(prev => ({ ...prev, pizzaSizes: newSizes }));
                                }}
                                className="w-full pl-9 pr-4 py-2 bg-white border border-stone-200 rounded-lg outline-none focus:ring-2 focus:ring-rose-200 font-bold text-stone-700 shadow-sm"
                              />
                            </div>
                          </div>
                          <div className="flex gap-4 items-center">
                            <div className="flex-1 flex flex-col gap-1">
                              <label className="text-[10px] font-bold uppercase tracking-widest text-stone-500 pl-1">Qtd Fatias</label>
                              <input
                                type="text"
                                placeholder="Ex: 8 fatias"
                                value={opt.fatias || ''}
                                onChange={e => {
                                  const newSizes = [...storeSettings.pizzaSizes];
                                  newSizes[idx] = { ...newSizes[idx], fatias: e.target.value };
                                  setStoreSettings(prev => ({ ...prev, pizzaSizes: newSizes }));
                                }}
                                className="w-full px-3 py-2 bg-white border border-stone-200 rounded-lg outline-none focus:ring-2 focus:ring-rose-200 text-xs font-medium text-stone-700"
                              />
                            </div>
                            <div className="flex-1 flex flex-col gap-1">
                              <label className="text-[10px] font-bold uppercase tracking-widest text-stone-500 pl-1">Diâmetro (cm)</label>
                              <input
                                type="text"
                                placeholder="Ex: 35cm"
                                value={opt.diameter || ''}
                                onChange={e => {
                                  const newSizes = [...storeSettings.pizzaSizes];
                                  newSizes[idx] = { ...newSizes[idx], diameter: e.target.value };
                                  setStoreSettings(prev => ({ ...prev, pizzaSizes: newSizes }));
                                }}
                                className="w-full px-3 py-2 bg-white border border-stone-200 rounded-lg outline-none focus:ring-2 focus:ring-rose-200 text-xs font-medium text-stone-700"
                              />
                            </div>
                            <div className="flex-1 flex flex-col gap-1">
                              <label className="text-[10px] font-bold uppercase tracking-widest text-stone-500 pl-1 whitespace-nowrap">Borda (R$)</label>
                              <div className="relative flex-1">
                                <span className="absolute left-2 top-2.5 text-stone-400 text-xs">R$</span>
                                <input
                                  type="text"
                                  placeholder="15,00"
                                  value={opt.bordaPrice || opt.bordaPrice === 0 ? Number(opt.bordaPrice).toFixed(2) : (storeSettings.bordaPrices?.[opt.size] || storeSettings.bordaPrices?.[opt.size] === 0 ? Number(storeSettings.bordaPrices[opt.size]).toFixed(2) : '')}
                                  onChange={e => {
                                    const valStr = e.target.value.replace(/\D/g, '');
                                    const val = valStr ? parseFloat(valStr) / 100 : 0;
                                    const newSizes = [...storeSettings.pizzaSizes];
                                    newSizes[idx] = { ...newSizes[idx], bordaPrice: val };
                                    setStoreSettings(prev => ({ ...prev, pizzaSizes: newSizes }));
                                  }}
                                  className="w-full pl-7 pr-2 py-2 bg-white border border-stone-200 rounded-lg outline-none focus:ring-2 focus:ring-rose-200 text-xs font-medium text-stone-700"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                      <button
                        onClick={() => {
                          const currentSizes = (storeSettings.pizzaSizes && storeSettings.pizzaSizes.length > 0) ? storeSettings.pizzaSizes : SIZE_OPTIONS;
                          const newSizes = [...currentSizes, { size: 'Novo', price: 0, fatias: '', diameter: '', bordaPrice: 0 }];
                          setStoreSettings(prev => ({ ...prev, pizzaSizes: newSizes }));
                        }}
                        className="mt-2 w-full py-3 border-2 border-dashed border-stone-200 text-stone-500 font-bold rounded-xl hover:border-stone-400 hover:text-stone-700 hover:bg-stone-50 transition-all flex items-center justify-center gap-2"
                      >
                        <Plus size={18} /> Adicionar Tamanho
                      </button>
                    </div>
                  </div>

                  {/* BAIRROS E ENTREGA */}
                  <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-stone-100 flex flex-col">
                    <h3 className="font-bold text-lg text-stone-700 mb-4 flex items-center gap-2">
                      <MapPin size={20} className="text-stone-500" /> Entregas
                    </h3>

                    <div className="bg-stone-50 p-4 rounded-2xl border border-stone-100 mb-6 space-y-3">
                      <h4 className="text-xs font-bold text-stone-500 uppercase tracking-widest pl-1">Novo Bairro</h4>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <div className="flex-1 space-y-2">
                          <input
                            type="text"
                            placeholder="Nome do Bairro"
                            value={newNeighborhood.name}
                            onChange={e => setNewNeighborhood(prev => ({ ...prev, name: e.target.value }))}
                            className="w-full px-4 py-2.5 bg-white rounded-xl border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-stone-200 shadow-sm transition-all"
                          />
                          <div className="relative flex-1">
                            <span className="absolute left-3 top-3 text-stone-400 text-sm">R$</span>
                            <input
                              type="text"
                              placeholder="Taxa (ex: 5.00)"
                              value={newNeighborhood.fee}
                              onChange={e => {
                                const valStr = e.target.value.replace(/\D/g, '');
                                if (valStr) {
                                  setNewNeighborhood(prev => ({ ...prev, fee: (parseFloat(valStr) / 100).toFixed(2) }));
                                } else {
                                  setNewNeighborhood(prev => ({ ...prev, fee: '' }));
                                }
                              }}
                              className="w-full pl-8 pr-4 py-2.5 bg-white rounded-xl border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-stone-200 shadow-sm transition-all"
                            />
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            if (!newNeighborhood.name) return alert('Preencha o nome do bairro');
                            const feeVal = newNeighborhood.fee ? parseFloat(newNeighborhood.fee) : 0;
                            setStoreSettings(prev => ({
                              ...prev,
                              deliveryNeighborhoods: [...prev.deliveryNeighborhoods, { name: newNeighborhood.name, fee: feeVal }]
                            }));
                            setNewNeighborhood({ name: '', fee: '' });
                          }}
                          className="bg-stone-800 text-white px-6 py-2.5 rounded-xl hover:bg-stone-700 transition-colors flex items-center justify-center shadow-sm font-bold w-full sm:w-auto mt-2 sm:mt-0"
                        >
                          <Plus size={20} />
                        </button>
                      </div>
                    </div>

                    <div className="max-h-60 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                      {storeSettings.deliveryNeighborhoods.map((nb: any, idx: number) => (
                        <div key={idx} className="group flex justify-between items-center p-3 bg-stone-50 rounded-xl border border-stone-100 hover:border-stone-300 transition-all">
                          {editingNeighborhood === idx ? (
                            <div className="flex-1 flex gap-2 w-full">
                              <div className="flex-[2] flex flex-col gap-1">
                                <input
                                  type="text"
                                  value={editNeighborhoodForm.name}
                                  onChange={e => setEditNeighborhoodForm({ ...editNeighborhoodForm, name: e.target.value })}
                                  className="w-full px-2 py-1 rounded border border-stone-200 text-sm focus:outline-none focus:ring-1 focus:ring-stone-200"
                                />
                                <div className="relative">
                                  <span className="absolute left-2 top-1.5 text-stone-400 text-xs">R$</span>
                                  <input
                                    type="text"
                                    value={editNeighborhoodForm.fee}
                                    onChange={e => {
                                      const valStr = e.target.value.replace(/\D/g, '');
                                      if (valStr) {
                                        setEditNeighborhoodForm({ ...editNeighborhoodForm, fee: (parseFloat(valStr) / 100).toFixed(2) });
                                      } else {
                                        setEditNeighborhoodForm({ ...editNeighborhoodForm, fee: '' });
                                      }
                                    }}
                                    className="w-full pl-6 pr-2 py-1 rounded border border-stone-200 text-sm focus:outline-none focus:ring-1 focus:ring-stone-200"
                                  />
                                </div>
                              </div>
                              <div className="flex flex-col gap-1 justify-center">
                                <button
                                  onClick={() => {
                                    const feeVal = editNeighborhoodForm.fee ? parseFloat(editNeighborhoodForm.fee) : 0;
                                    const newNbs = [...storeSettings.deliveryNeighborhoods];
                                    newNbs[idx] = { name: editNeighborhoodForm.name, fee: feeVal };
                                    setStoreSettings(prev => ({ ...prev, deliveryNeighborhoods: newNbs }));
                                    setEditingNeighborhood(null);
                                  }}
                                  className="bg-stone-800 text-white p-1 rounded hover:bg-stone-700 transition-colors flex items-center justify-center"
                                >
                                  <Check size={16} />
                                </button>
                                <button
                                  onClick={() => setEditingNeighborhood(null)}
                                  className="bg-stone-200 p-1 rounded hover:bg-stone-300 text-stone-600 transition-colors flex items-center justify-center"
                                >
                                  <X size={16} />
                                </button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <div className="flex flex-col">
                                <span className="font-bold text-stone-700">{nb.name}</span>
                                <span className={`text-xs font-bold px-2 py-0.5 rounded-full w-fit mt-1 ${nb.fee > 0 ? 'text-stone-600 bg-stone-200' : 'text-green-600 bg-green-50'}`}>
                                  {nb.fee > 0 ? `R$ ${Number(nb.fee).toFixed(2).replace('.', ',')}` : 'Grátis'}
                                </span>
                              </div>
                              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={() => {
                                    setEditingNeighborhood(idx);
                                    setEditNeighborhoodForm({ name: nb.name, fee: nb.fee > 0 ? Number(nb.fee).toFixed(2) : '' });
                                  }}
                                  className="text-stone-300 hover:text-stone-500 transition-colors p-2"
                                >
                                  <Edit2 size={16} />
                                </button>
                                <button
                                  onClick={() => {
                                    if (confirm('Remover este bairro?')) {
                                      const newNbs = storeSettings.deliveryNeighborhoods.filter((_, i) => i !== idx);
                                      setStoreSettings(prev => ({ ...prev, deliveryNeighborhoods: newNbs }));
                                    }
                                  }}
                                  className="text-stone-300 hover:text-red-500 transition-colors p-2"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      ))}
                      {storeSettings.deliveryNeighborhoods.length === 0 && (
                        <div className="text-center text-stone-400 text-sm py-4 border-2 border-dashed border-stone-200 rounded-xl">
                          Nenhum bairro cadastrado
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )
        }

        {/* MENU MANAGEMENT TAB */}
        {
          activeTab === 'menu' && (
            <div className="bg-stone-50 p-6 border-b border-stone-200 no-print animate-in fade-in slide-in-from-left-4 duration-300">
              <div className="max-w-7xl mx-auto">
                <h2 className="text-xl font-serif font-bold text-stone-800 mb-6 flex items-center gap-2">
                  <ReceiptText size={24} className="text-stone-400" />
                  Gerenciar Cardápio
                </h2>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">

                  {/* SABORES */}
                  <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-stone-100">
                    <h3 className="font-bold text-lg text-stone-700 mb-4 flex items-center gap-2">
                      <Pizza size={20} className="text-rose-500" /> Sabores de Pizza
                    </h3>

                    <div className="bg-stone-50 p-4 rounded-2xl border border-stone-100 mb-6 space-y-3">
                      <h4 className="text-xs font-bold text-stone-500 uppercase tracking-widest pl-1">Novo Sabor</h4>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <div className="flex-1 space-y-2">
                          <input
                            type="text"
                            placeholder="Nome do Sabor"
                            value={newFlavor.name}
                            onChange={e => setNewFlavor(prev => ({ ...prev, name: e.target.value }))}
                            className="w-full px-4 py-2.5 bg-white rounded-xl border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-200 shadow-sm transition-all"
                          />
                          <input
                            type="text"
                            placeholder="Ingredientes"
                            value={newFlavor.ingredients}
                            onChange={e => setNewFlavor(prev => ({ ...prev, ingredients: e.target.value }))}
                            className="w-full px-4 py-2.5 bg-white rounded-xl border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-200 shadow-sm transition-all"
                          />
                        </div>
                        <button
                          onClick={async () => {
                            if (!newFlavor.name || !newFlavor.ingredients) return alert('Preencha nome e ingredientes');
                            const { data, error } = await supabase.from('pizza_flavors').insert([{ name: newFlavor.name, ingredients: newFlavor.ingredients }]).select();
                            if (data) {
                              setFlavorsList(prev => [...prev, data[0]]);
                              setNewFlavor({ name: '', ingredients: '' });
                            }
                            if (error) alert('Erro ao adicionar sabor');
                          }}
                          className="bg-stone-800 text-white px-6 py-2.5 rounded-xl hover:bg-stone-700 transition-colors flex items-center justify-center shadow-sm font-bold w-full sm:w-auto mt-2 sm:mt-0"
                        >
                          <Plus size={20} />
                        </button>
                      </div>
                    </div>

                    <div className="max-h-60 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                      {flavorsList.map(flavor => (
                        <div key={flavor.id} className="group flex justify-between items-center p-3 bg-stone-50 rounded-xl border border-stone-100 hover:border-stone-300 transition-all">
                          {editingFlavor === flavor.id ? (
                            <div className="flex-1 flex gap-2 w-full">
                              <div className="flex-[2] flex flex-col gap-1">
                                <input
                                  type="text"
                                  value={editFlavorForm.name}
                                  onChange={e => setEditFlavorForm({ ...editFlavorForm, name: e.target.value })}
                                  className="w-full px-2 py-1 rounded border border-stone-200 text-sm focus:outline-none focus:ring-1 focus:ring-rose-200"
                                />
                                <input
                                  type="text"
                                  value={editFlavorForm.ingredients}
                                  onChange={e => setEditFlavorForm({ ...editFlavorForm, ingredients: e.target.value })}
                                  className="w-full px-2 py-1 rounded border border-stone-200 text-xs text-stone-500 focus:outline-none focus:ring-1 focus:ring-rose-200"
                                />
                              </div>
                              <div className="flex flex-col gap-1 justify-center">
                                <button
                                  onClick={async () => {
                                    if (!editFlavorForm.name || !editFlavorForm.ingredients) return alert('Preencha os dados');
                                    const { data, error } = await supabase
                                      .from('pizza_flavors')
                                      .update({ name: editFlavorForm.name, ingredients: editFlavorForm.ingredients })
                                      .eq('id', flavor.id)
                                      .select();
                                    if (data) {
                                      setFlavorsList(prev => prev.map(f => f.id === flavor.id ? data[0] : f));
                                      setEditingFlavor(null);
                                    }
                                    if (error) alert('Erro ao editar sabor');
                                  }}
                                  className="text-green-600 hover:bg-green-100 p-1.5 rounded transition-colors"
                                >
                                  <Save size={16} />
                                </button>
                                <button
                                  onClick={() => setEditingFlavor(null)}
                                  className="text-stone-400 hover:bg-stone-200 p-1.5 rounded transition-colors"
                                >
                                  <X size={16} />
                                </button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <div className="flex-1">
                                <div className="font-bold text-stone-700 text-sm">{flavor.name}</div>
                                <div className="text-[10px] text-stone-400">{flavor.ingredients}</div>
                              </div>
                              <div className="flex items-center gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={() => {
                                    setEditingFlavor(flavor.id);
                                    setEditFlavorForm({ name: flavor.name, ingredients: flavor.ingredients });
                                  }}
                                  className="text-stone-300 hover:text-blue-500 transition-colors p-2"
                                >
                                  <Pencil size={16} />
                                </button>
                                <button
                                  onClick={async () => {
                                    if (confirm('Excluir este sabor?')) {
                                      await supabase.from('pizza_flavors').delete().eq('id', flavor.id);
                                      setFlavorsList(prev => prev.filter(f => f.id !== flavor.id));
                                    }
                                  }}
                                  className="text-stone-300 hover:text-red-500 transition-colors p-2"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* BEBIDAS */}
                  <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-stone-100">
                    <h3 className="font-bold text-lg text-stone-700 mb-4 flex items-center gap-2">
                      <ShoppingBag size={20} className="text-blue-500" /> Bebidas
                    </h3>

                    <div className="bg-stone-50 p-4 rounded-2xl border border-stone-100 mb-6 space-y-3">
                      <h4 className="text-xs font-bold text-stone-500 uppercase tracking-widest pl-1">Nova Bebida</h4>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <div className="flex-1 space-y-2">
                          <input
                            type="text"
                            placeholder="Nome da Bebida"
                            value={newBeverage.name}
                            onChange={e => setNewBeverage(prev => ({ ...prev, name: e.target.value }))}
                            className="w-full px-4 py-2.5 bg-white rounded-xl border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 shadow-sm transition-all"
                          />
                          <div className="relative flex-1">
                            <span className="absolute left-3 top-3 text-stone-400 text-sm">R$</span>
                            <input
                              type="text"
                              placeholder="Preço (ex: 15.00)"
                              value={newBeverage.price}
                              onChange={e => {
                                const valStr = e.target.value.replace(/\D/g, '');
                                if (valStr) {
                                  setNewBeverage(prev => ({ ...prev, price: (parseFloat(valStr) / 100).toFixed(2) }));
                                } else {
                                  setNewBeverage(prev => ({ ...prev, price: '' }));
                                }
                              }}
                              className="w-full pl-8 pr-4 py-2.5 bg-white rounded-xl border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 shadow-sm transition-all"
                            />
                          </div>
                        </div>
                        <button
                          onClick={async () => {
                            if (!newBeverage.name || !newBeverage.price) return alert('Preencha nome e preço');
                            const { data, error } = await supabase.from('beverages').insert([{ name: newBeverage.name, price: parseFloat(newBeverage.price) }]).select();
                            if (data) {
                              setBeveragesList(prev => [...prev, data[0]]);
                              setNewBeverage({ name: '', price: '' });
                            }
                            if (error) alert('Erro ao adicionar bebida');
                          }}
                          className="bg-stone-800 text-white px-6 py-2.5 rounded-xl hover:bg-stone-700 transition-colors flex items-center justify-center shadow-sm font-bold w-full sm:w-auto mt-2 sm:mt-0"
                        >
                          <Plus size={20} />
                        </button>
                      </div>
                    </div>

                    <div className="max-h-60 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                      {beveragesList.map(drink => (
                        <div key={drink.id} className="group flex justify-between items-center p-3 bg-stone-50 rounded-xl border border-stone-100 hover:border-stone-300 transition-all">
                          {editingBeverage === drink.id ? (
                            <div className="flex-1 flex gap-2 w-full">
                              <div className="flex-[2] flex flex-col gap-1">
                                <input
                                  type="text"
                                  value={editBeverageForm.name}
                                  onChange={e => setEditBeverageForm({ ...editBeverageForm, name: e.target.value })}
                                  className="w-full px-2 py-1 rounded border border-stone-200 text-sm focus:outline-none focus:ring-1 focus:ring-blue-200"
                                />
                                <div className="relative">
                                  <span className="absolute left-2 top-1.5 text-stone-400 text-xs">R$</span>
                                  <input
                                    type="text"
                                    value={editBeverageForm.price}
                                    onChange={e => {
                                      const valStr = e.target.value.replace(/\D/g, '');
                                      if (valStr) {
                                        setEditBeverageForm({ ...editBeverageForm, price: (parseFloat(valStr) / 100).toFixed(2) });
                                      } else {
                                        setEditBeverageForm({ ...editBeverageForm, price: '' });
                                      }
                                    }}
                                    className="w-full pl-7 pr-2 py-1 rounded border border-stone-200 text-xs text-stone-500 focus:outline-none focus:ring-1 focus:ring-blue-200"
                                  />
                                </div>
                              </div>
                              <div className="flex flex-col gap-1 justify-center">
                                <button
                                  onClick={async () => {
                                    if (!editBeverageForm.name || !editBeverageForm.price) return alert('Preencha os dados');
                                    const { data, error } = await supabase
                                      .from('beverages')
                                      .update({ name: editBeverageForm.name, price: parseFloat(editBeverageForm.price) })
                                      .eq('id', drink.id)
                                      .select();
                                    if (data) {
                                      setBeveragesList(prev => prev.map(b => b.id === drink.id ? data[0] : b));
                                      setEditingBeverage(null);
                                    }
                                    if (error) alert('Erro ao editar bebida');
                                  }}
                                  className="text-green-600 hover:bg-green-100 p-1.5 rounded transition-colors"
                                >
                                  <Save size={16} />
                                </button>
                                <button
                                  onClick={() => setEditingBeverage(null)}
                                  className="text-stone-400 hover:bg-stone-200 p-1.5 rounded transition-colors"
                                >
                                  <X size={16} />
                                </button>
                              </div>
                            </div>
                          ) : (
                            <>
                              <div className="flex-1">
                                <div className="font-bold text-stone-700 text-sm">{drink.name}</div>
                                <div className="text-[10px] text-stone-500 font-bold">R$ {parseFloat(drink.price).toFixed(2).replace('.', ',')}</div>
                              </div>
                              <div className="flex items-center gap-1 opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={() => {
                                    setEditingBeverage(drink.id);
                                    setEditBeverageForm({ name: drink.name, price: drink.price.toString() });
                                  }}
                                  className="text-stone-300 hover:text-blue-500 transition-colors p-2"
                                >
                                  <Pencil size={16} />
                                </button>
                                <button
                                  onClick={async () => {
                                    if (confirm('Excluir esta bebida?')) {
                                      await supabase.from('beverages').delete().eq('id', drink.id);
                                      setBeveragesList(prev => prev.filter(b => b.id !== drink.id));
                                    }
                                  }}
                                  className="text-stone-300 hover:text-red-500 transition-colors p-2"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )
        }

        {/* COUPONS MANAGEMENT TAB */}
        {
          activeTab === 'coupons' && (
            <div className="bg-stone-50 p-6 border-b border-stone-200 no-print animate-in fade-in slide-in-from-left-4 duration-300">
              <div className="max-w-4xl mx-auto">
                <h2 className="text-xl font-serif font-bold text-stone-800 mb-6 flex items-center gap-2">
                  <TicketPercent size={24} className="text-stone-400" />
                  Gerenciar Cupons de Desconto
                </h2>

                <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-stone-100 flex flex-col md:flex-row gap-8">
                  <div className="md:w-1/3">
                    <h3 className="font-bold text-lg text-stone-700 mb-4 whitespace-nowrap">Criar Novo Cupom</h3>
                    <div className="space-y-3">
                      <input
                        type="text"
                        placeholder="Código (ex: PROMO10)"
                        value={newCoupon.code}
                        onChange={e => setNewCoupon(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                        className="w-full px-4 py-3 rounded-xl border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-200 uppercase"
                      />
                      <div className="relative">
                        <span className="absolute left-3 top-2.5 text-stone-400 text-sm">R$</span>
                        <input
                          type="text"
                          placeholder="Valor do Desconto"
                          value={newCoupon.discount_amount}
                          onChange={e => {
                            const value = e.target.value.replace(/\D/g, '');
                            if (value) {
                              const formatted = (parseFloat(value) / 100).toFixed(2);
                              setNewCoupon(prev => ({ ...prev, discount_amount: formatted }));
                            } else {
                              setNewCoupon(prev => ({ ...prev, discount_amount: '' }));
                            }
                          }}
                          className="w-full pl-8 pr-4 py-3 rounded-xl border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-200"
                        />
                      </div>
                      <div className="space-y-1 mt-4">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-stone-500 ml-1">Quantidade Máxima de Usos Totais</label>
                        <input
                          type="number"
                          placeholder="Ex: 50 (Deixe em branco para uso único)"
                          value={newCoupon.max_uses}
                          onChange={e => setNewCoupon(prev => ({ ...prev, max_uses: e.target.value }))}
                          className="w-full px-4 py-3 rounded-xl border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-200"
                          min="1"
                        />
                      </div>
                      <button
                        onClick={async () => {
                          if (!newCoupon.code || !newCoupon.discount_amount) return alert('Siga padrão Código e Valor.');
                          const { data, error } = await supabase.from('coupons').insert([{
                            code: newCoupon.code,
                            discount_amount: parseFloat(newCoupon.discount_amount),
                            max_uses: parseInt(newCoupon.max_uses) || 1
                          }]).select();
                          if (data) {
                            setCouponsList(prev => [data[0], ...prev]);
                            setNewCoupon({ code: '', discount_amount: '', max_uses: '1' });
                          }
                          if (error) alert('Erro ao criar. O código pode já existir.');
                        }}
                        className="w-full bg-stone-800 text-white font-bold p-3 rounded-xl hover:bg-stone-700 transition-colors flex items-center justify-center gap-2 mt-2"
                      >
                        <Plus size={18} /> Adicionar Cupom
                      </button>
                    </div>
                  </div>

                  <div className="md:w-2/3">
                    <h3 className="font-bold text-lg text-stone-700 mb-4">Cupons Ativos e Histórico</h3>
                    <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                      {couponsList.length === 0 ? (
                        <p className="text-stone-400 text-sm italic py-4">Nenhum cupom cadastrado.</p>
                      ) : couponsList.map(coupon => (
                        <div key={coupon.id} className={`flex flex-col sm:flex-row justify-between items-center p-4 rounded-xl border transition-all ${coupon.is_active && coupon.used_count < coupon.max_uses ? 'bg-green-50/50 border-green-100' : 'bg-stone-50 border-stone-200 opacity-60 grayscale'}`}>
                          <div className="flex-1 mb-2 sm:mb-0 w-full">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-bold text-stone-800 font-mono tracking-wider">{coupon.code}</span>
                              {!coupon.is_active ? (
                                <span className="text-[9px] bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">Inativo</span>
                              ) : coupon.used_count >= coupon.max_uses ? (
                                <span className="text-[9px] bg-stone-200 text-stone-600 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">Esgotado</span>
                              ) : (
                                <span className="text-[9px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">Ativo</span>
                              )}
                            </div>
                            <div className="text-xs text-stone-500 font-medium flex gap-3">
                              <span>Desconto: <strong className="text-rose-600">R$ {parseFloat(coupon.discount_amount).toFixed(2)}</strong></span>
                              <span>Usos: <strong>{coupon.used_count}</strong> / {coupon.max_uses}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                            <button
                              onClick={async () => {
                                const { data, error } = await supabase.from('coupons').update({ is_active: !coupon.is_active }).eq('id', coupon.id).select();
                                if (data) setCouponsList(prev => prev.map(c => c.id === coupon.id ? data[0] : c));
                              }}
                              className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-colors ${coupon.is_active ? 'bg-stone-200 text-stone-600 hover:bg-stone-300' : 'bg-green-100 text-green-700 hover:bg-green-200'}`}
                            >
                              {coupon.is_active ? 'Desativar' : 'Ativar'}
                            </button>
                            <button
                              onClick={async () => {
                                if (confirm('Excluir este cupom permanentemente?')) {
                                  await supabase.from('coupons').delete().eq('id', coupon.id);
                                  setCouponsList(prev => prev.filter(c => c.id !== coupon.id));
                                }
                              }}
                              className="p-1.5 text-stone-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )
        }

        {/* CUSTOMERS TAB */}
        {
          activeTab === 'customers' && (
            <div className="bg-stone-50 p-6 border-b border-stone-200 no-print animate-in fade-in slide-in-from-left-4 duration-300 min-h-screen">
              <div className="max-w-7xl mx-auto space-y-6">
                <h2 className="text-xl font-serif font-bold text-stone-800 flex items-center gap-2">
                  <Users size={24} className="text-stone-400" />
                  Base de Clientes ({customersList.length})
                </h2>

                <div className="bg-white rounded-[2rem] shadow-sm border border-stone-100 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-stone-50 text-stone-500 text-xs uppercase tracking-wider font-bold border-b border-stone-200">
                          <th className="p-4 pl-6">Nome</th>
                          <th className="p-4">Telefone</th>
                          <th className="p-4">Endereço Principal</th>
                          <th className="p-4 text-center">Total Pedidos</th>
                          <th className="p-4 text-right pr-6">Último Pedido</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-100">
                        {customersList.map((customer) => {
                          const isExpanded = selectedCustomer === customer.phone;
                          const customerOrders = orders.filter(o => o.customerInfo?.phone?.replace(/\D/g, '') === customer.phone);

                          return (
                            <React.Fragment key={customer.phone}>
                              <tr
                                onClick={() => setSelectedCustomer(isExpanded ? null : customer.phone)}
                                className={`cursor-pointer transition-colors hover:bg-rose-50/50 ${isExpanded ? 'bg-rose-50/30' : ''}`}
                              >
                                <td className="p-4 pl-6 font-bold text-stone-800">{customer.name}</td>
                                <td className="p-4 font-mono text-stone-600 text-sm">{customer.phone}</td>
                                <td className="p-4 text-sm text-stone-500 w-1/3 truncate max-w-[200px]">
                                  {customer.rua ? `${customer.rua}, ${customer.numero} - ${customer.bairro}` : '-'}
                                </td>
                                <td className="p-4 text-center">
                                  <span className="inline-block bg-stone-100 text-stone-700 px-3 py-1 rounded-full text-xs font-bold">
                                    {customerOrders.length}
                                  </span>
                                </td>
                                <td className="p-4 text-right pr-6 text-sm text-stone-500">
                                  {new Date(customer.last_order_date).toLocaleDateString('pt-BR')}
                                </td>
                              </tr>

                              {/* EXPANDED VIEW: LAST ORDERS */}
                              {isExpanded && (
                                <tr className="bg-stone-50/50">
                                  <td colSpan={5} className="p-0 border-b border-stone-200">
                                    <div className="animate-in slide-in-from-top-2 duration-200 p-6 pl-12 border-l-4 border-rose-400">
                                      <h4 className="font-bold text-sm text-stone-700 mb-4 uppercase tracking-wider flex items-center gap-2">
                                        <ReceiptText size={16} className="text-rose-500" />
                                        Histórico de Pedidos ({customerOrders.length})
                                      </h4>

                                      {customerOrders.length === 0 ? (
                                        <p className="text-sm text-stone-500 italic">Nenhum pedido encontrado na sessão atual para este cliente.</p>
                                      ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                          {customerOrders.sort((a, b) => b.createdAt - a.createdAt).map(o => (
                                            <div
                                              key={o.id}
                                              onClick={() => setSelectedCustomerOrder(o)}
                                              className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm cursor-pointer hover:border-rose-400 hover:shadow-md transition-all group"
                                            >
                                              <div className="flex justify-between items-center mb-2 pb-2 border-b border-stone-100">
                                                <span className="text-xs font-bold text-stone-400 uppercase group-hover:text-stone-600 transition-colors">{new Date(o.createdAt).toLocaleDateString('pt-BR')}</span>
                                                <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full">R$ {o.total.toFixed(2).replace('.', ',')}</span>
                                              </div>
                                              <div className="space-y-1">
                                                {o.pizzas.map((p, i) => (
                                                  <div key={i} className="text-xs text-stone-600 flex items-center gap-1">
                                                    <Pizza size={10} className="text-stone-400" />
                                                    <span className="truncate">{p.size} - {p.type === 'whole' ? p.whole?.name : 'Mista'}</span>
                                                  </div>
                                                ))}
                                                {o.refrigerantes.length > 0 && (
                                                  <div className="text-xs text-stone-500 italic mt-1 pt-1 border-t border-stone-50">
                                                    + {o.refrigerantes.length} bebida{o.refrigerantes.length > 1 ? 's' : ''}
                                                  </div>
                                                )}
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </React.Fragment>
                          );
                        })}
                        {customersList.length === 0 && (
                          <tr>
                            <td colSpan={5} className="p-8 text-center text-stone-400 italic">Nenhum cliente cadastrado ainda.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )
        }

        {/* ANALYTICS TAB */}
        {
          activeTab === 'analytics' && (
            <div className="bg-stone-50 p-6 border-b border-stone-200 no-print animate-in fade-in slide-in-from-left-4 duration-300 min-h-screen">
              <div className="max-w-7xl mx-auto space-y-6">

                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                  <h2 className="text-xl font-serif font-bold text-stone-800 flex items-center gap-2">
                    <BarChart3 size={24} className="text-stone-400" />
                    Relatórios Financeiros
                  </h2>

                  <div className="flex bg-white rounded-xl shadow-sm border border-stone-200 p-1">
                    <button
                      onClick={() => setAnalyticsPeriod('today')}
                      className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors ${analyticsPeriod === 'today' ? 'bg-rose-100 text-rose-700' : 'text-stone-500 hover:text-stone-700 hover:bg-stone-50'}`}
                    >Hoje</button>
                    <button
                      onClick={() => setAnalyticsPeriod('7days')}
                      className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors ${analyticsPeriod === '7days' ? 'bg-rose-100 text-rose-700' : 'text-stone-500 hover:text-stone-700 hover:bg-stone-50'}`}
                    >7 Dias</button>
                    <button
                      onClick={() => setAnalyticsPeriod('30days')}
                      className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors ${analyticsPeriod === '30days' ? 'bg-rose-100 text-rose-700' : 'text-stone-500 hover:text-stone-700 hover:bg-stone-50'}`}
                    >30 Dias</button>
                    <button
                      onClick={() => setAnalyticsPeriod('all')}
                      className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors ${analyticsPeriod === 'all' ? 'bg-rose-100 text-rose-700' : 'text-stone-500 hover:text-stone-700 hover:bg-stone-50'}`}
                    >Tudo</button>
                  </div>
                </div>

                {(() => {
                  const now = new Date();
                  // Somente pedidos concluídos devem compor o financeiro real (ou não, mas vamos garantir o filtro)
                  const filteredOrders = orders.filter(o => {
                    if (analyticsPeriod === 'all') return true;
                    const orderDate = (typeof o.createdAt === 'number' || typeof o.createdAt === 'string') ? new Date(o.createdAt) : new Date();
                    if (isNaN(orderDate.getTime())) return false;

                    const diffTime = Math.abs(now.getTime() - orderDate.getTime());
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                    if (analyticsPeriod === 'today') return orderDate.toDateString() === now.toDateString();
                    if (analyticsPeriod === '7days') return diffDays <= 7;
                    if (analyticsPeriod === '30days') return diffDays <= 30;
                    return true;
                  }); // Para considerar todos: não filtramos status por enquanto, caso o usuário use pedidos para testar.

                  const flavorCounts: Record<string, number> = {};
                  const sizeCounts: Record<string, number> = {};
                  const beverageCounts: Record<string, number> = {};

                  const revenueByDayOfWeek: Record<number, number> = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 };
                  const ordersByHour: Record<number, number> = {};
                  for (let i = 0; i < 24; i++) ordersByHour[i] = 0;

                  let totalRevenue = 0;

                  filteredOrders.forEach(o => {
                    totalRevenue += o.total || 0;

                    // Graph Data
                    const oDate = (typeof o.createdAt === 'number' || typeof o.createdAt === 'string') ? new Date(o.createdAt) : new Date();
                    if (!isNaN(oDate.getTime())) {
                      revenueByDayOfWeek[oDate.getDay()] += (o.total || 0);
                      ordersByHour[oDate.getHours()] += 1;
                    }

                    o.pizzas.forEach(p => {
                      if (p.size) {
                        sizeCounts[p.size] = (sizeCounts[p.size] || 0) + 1;
                      }
                      if (p.type === 'whole' && p.whole) {
                        flavorCounts[p.whole.name] = (flavorCounts[p.whole.name] || 0) + 1;
                      } else if (p.type === 'half' && p.half1 && p.half2) {
                        flavorCounts[p.half1.name] = (flavorCounts[p.half1.name] || 0) + 0.5;
                        flavorCounts[p.half2.name] = (flavorCounts[p.half2.name] || 0) + 0.5;
                      }
                    });
                    o.refrigerantes.forEach(r => {
                      beverageCounts[r.name] = (beverageCounts[r.name] || 0) + 1;
                    });
                  });

                  const topFlavors = Object.entries(flavorCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);
                  const topSizes = Object.entries(sizeCounts).sort((a, b) => b[1] - a[1]);
                  const topBeverages = Object.entries(beverageCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);

                  const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
                  const maxRevenueDay = Math.max(...Object.values(revenueByDayOfWeek), 1);
                  const maxOrdersHour = Math.max(...Object.values(ordersByHour), 1);

                  return (
                    <div className="space-y-6">
                      {/* Resumo Financeiro */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-stone-100 flex items-center gap-4">
                          <div className="p-4 bg-green-50 rounded-2xl text-green-600">
                            <CircleDashed size={32} />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-stone-400 uppercase tracking-widest">Faturamento</p>
                            <p className="text-2xl font-serif font-bold text-stone-800">R$ {totalRevenue.toFixed(2).replace('.', ',')}</p>
                          </div>
                        </div>
                        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-stone-100 flex items-center gap-4">
                          <div className="p-4 bg-rose-50 rounded-2xl text-rose-600">
                            <ReceiptText size={32} />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-stone-400 uppercase tracking-widest">Pedidos Concluídos</p>
                            <p className="text-2xl font-serif font-bold text-stone-800">{filteredOrders.length}</p>
                          </div>
                        </div>
                        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-stone-100 flex items-center gap-4">
                          <div className="p-4 bg-blue-50 rounded-2xl text-blue-600">
                            <TrendingUp size={32} />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-stone-400 uppercase tracking-widest">Ticket Médio</p>
                            <p className="text-2xl font-serif font-bold text-stone-800">R$ {(filteredOrders.length > 0 ? totalRevenue / filteredOrders.length : 0).toFixed(2).replace('.', ',')}</p>
                          </div>
                        </div>
                      </div>

                      {/* Gráficos Financeiros */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Faturamento por Dia da Semana */}
                        <div className="bg-white rounded-[2rem] shadow-sm border border-stone-100 p-6">
                          <h3 className="font-bold text-stone-800 flex items-center gap-2 mb-2">
                            <Calendar className="text-stone-400" size={18} /> Vendas por Dia da Semana
                          </h3>
                          <div className="h-48 pt-10 flex items-end justify-between gap-2">
                            {dayNames.map((day, index) => {
                              const rev = revenueByDayOfWeek[index];
                              const heightPercentage = Math.max((rev / maxRevenueDay) * 100, (rev > 0 ? 5 : 0));
                              return (
                                <div key={day} className="flex flex-col items-center flex-1 gap-2 group relative h-full">
                                  {/* Tooltip de Valor */}
                                  <div className="absolute -top-10 bg-stone-800 text-white text-[10px] font-bold py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10 shadow-lg">
                                    R$ {rev.toFixed(2)}
                                  </div>
                                  <div className="w-full bg-stone-100 rounded-xl flex items-end justify-center h-full relative cursor-pointer border border-stone-200/50 hover:bg-stone-200 transition-colors">
                                    <div
                                      className={`w-full transition-all rounded-xl ${rev > 0 ? 'bg-green-400/80 group-hover:bg-green-500 shadow-sm' : 'bg-transparent'}`}
                                      style={{ height: `${heightPercentage}%` }}
                                    ></div>
                                  </div>
                                  <span className={`text-[10px] uppercase font-bold ${rev > 0 ? 'text-stone-600' : 'text-stone-400'}`}>{day}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Horários de Pico */}
                        <div className="bg-white rounded-[2rem] shadow-sm border border-stone-100 p-6">
                          <h3 className="font-bold text-stone-800 flex items-center gap-2 mb-2">
                            <Clock3 className="text-stone-400" size={18} /> Horários de Pico (Pedidos)
                          </h3>
                          <div className="h-48 pt-10 flex items-end justify-between gap-1 overflow-x-auto custom-scrollbar pb-2">
                            {[10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 0].map(hour => {
                              const count = ordersByHour[hour] || 0;
                              const heightPercentage = Math.max((count / maxOrdersHour) * 100, (count > 0 ? 5 : 0));
                              return (
                                <div key={hour} className="flex flex-col items-center flex-1 min-w-[24px] gap-2 group relative h-full">
                                  <div className="absolute -top-10 bg-stone-800 text-white text-[10px] font-bold py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10 shadow-lg flex flex-col items-center">
                                    <span>{count} {count === 1 ? 'pedido' : 'pedidos'}</span>
                                    <span className="text-[8px] text-stone-300 font-normal">{hour}:00 às {hour}:59</span>
                                  </div>
                                  <div className="w-full bg-stone-100 rounded-lg flex items-end justify-center h-full relative cursor-pointer border border-stone-200/50 hover:bg-stone-200 transition-colors">
                                    <div
                                      className={`w-full transition-all rounded-lg ${count > 0 ? 'bg-rose-400 group-hover:bg-rose-500 shadow-sm' : 'bg-transparent'}`}
                                      style={{ height: `${heightPercentage}%` }}
                                    ></div>
                                  </div>
                                  <span className={`text-[10px] font-bold ${count > 0 ? 'text-stone-600' : 'text-stone-400'}`}>{hour}h</span>
                                </div>
                              );
                            })}
                          </div>
                          <p className="text-[10px] text-stone-400 text-center mt-2 font-bold uppercase tracking-widest hidden sm:block">Período: 10:00 - 00:00</p>
                        </div>
                      </div>

                      {/* Tops Grids em 3 colunas */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Top Sabores */}
                        <div className="bg-white rounded-[2rem] shadow-sm border border-stone-100 overflow-hidden">
                          <div className="p-5 border-b border-stone-100 bg-stone-50/50 flex justify-between items-center">
                            <h3 className="font-bold text-stone-800 text-sm flex items-center gap-2">
                              <Pizza className="text-rose-500" size={16} /> Top 5 Sabores
                            </h3>
                          </div>
                          <div className="p-5">
                            {topFlavors.length === 0 ? (
                              <p className="text-stone-400 italic text-xs text-center py-4">Sem dados para o período.</p>
                            ) : (
                              <div className="space-y-4">
                                {topFlavors.map(([name, count], index) => {
                                  const percentage = ((count / filteredOrders.reduce((acc, o) => acc + o.pizzas.length, 0)) * 100) || 0;
                                  return (
                                    <div key={name} className="flex items-center gap-3">
                                      <div className="text-rose-600 font-bold text-sm min-w-[20px]">{index + 1}º</div>
                                      <div className="flex-1 overflow-hidden">
                                        <div className="flex justify-between items-end mb-1">
                                          <span className="font-bold text-stone-700 text-xs truncate max-w-[120px]">{name}</span>
                                          <span className="text-[10px] font-bold text-stone-500">{count} {count > 1 ? 'pedidos' : 'pedido'}</span>
                                        </div>
                                        <div className="w-full bg-stone-100 rounded-full h-1.5">
                                          <div className="bg-rose-400 h-1.5 rounded-full" style={{ width: `${Math.max(percentage, 2)}%` }}></div>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Top Tamanhos */}
                        <div className="bg-white rounded-[2rem] shadow-sm border border-stone-100 overflow-hidden">
                          <div className="p-5 border-b border-stone-100 bg-stone-50/50">
                            <h3 className="font-bold text-stone-800 text-sm flex items-center gap-2">
                              <CircleDashed className="text-rose-500" size={16} /> Tamanhos Mais Vendidos
                            </h3>
                          </div>
                          <div className="p-5">
                            {topSizes.length === 0 ? (
                              <p className="text-stone-400 italic text-xs text-center py-4">Sem dados.</p>
                            ) : (
                              <div className="space-y-3">
                                {topSizes.map(([size, count]) => (
                                  <div key={size} className="flex items-center justify-between p-2 rounded-xl border border-stone-50 bg-stone-50/50">
                                    <span className="text-sm font-bold text-stone-600">Pizza {size}</span>
                                    <span className="text-xs bg-white text-stone-700 border border-stone-200 px-3 py-1 rounded-full font-bold">{count}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Top Bebidas */}
                        <div className="bg-white rounded-[2rem] shadow-sm border border-stone-100 overflow-hidden">
                          <div className="p-5 border-b border-stone-100 bg-stone-50/50">
                            <h3 className="font-bold text-stone-800 text-sm flex items-center gap-2">
                              <Tag className="text-blue-500" size={16} /> Bebidas Populares
                            </h3>
                          </div>
                          <div className="p-5">
                            {topBeverages.length === 0 ? (
                              <p className="text-stone-400 italic text-xs text-center py-4">Sem dados.</p>
                            ) : (
                              <div className="space-y-3">
                                {topBeverages.map(([name, count]) => (
                                  <div key={name} className="flex items-center justify-between p-2 rounded-xl border border-stone-50 bg-stone-50/50">
                                    <span className="text-xs font-bold text-stone-600 truncate max-w-[120px]">{name}</span>
                                    <span className="text-[10px] bg-white text-stone-700 border border-stone-200 px-2 py-1 rounded-full font-bold">{count} vend.</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          )
        }

        {/* CUSTOMER ORDER MODAL */}
        {
          selectedCustomerOrder && (
            <div className="fixed inset-0 z-[60] bg-stone-900/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-300">
              <div className="bg-white rounded-[2rem] w-full max-w-lg max-h-[80vh] flex flex-col shadow-2xl overflow-hidden">
                <div className="p-6 border-b border-stone-100 flex justify-between items-center bg-stone-50">
                  <div>
                    <h3 className="text-xl font-bold text-stone-800 font-serif">Detalhes do Pedido</h3>
                    <p className="text-stone-500 text-xs font-bold uppercase tracking-widest mt-1">
                      #{selectedCustomerOrder.id.toUpperCase()} • {new Date(selectedCustomerOrder.createdAt).toLocaleString('pt-BR')}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedCustomerOrder(null)}
                    className="p-2 hover:bg-stone-200 rounded-full transition-colors bg-white border border-stone-200 shadow-sm"
                  >
                    <X size={20} className="text-stone-500" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">

                  {/* Resumo Financeiro */}
                  <div className="bg-rose-50 rounded-2xl p-4 border border-rose-100 flex justify-between items-center">
                    <div>
                      <p className="text-xs font-bold text-rose-600 uppercase tracking-widest mb-1">Total do Pedido</p>
                      <p className="text-2xl font-serif font-black text-rose-700">R$ {selectedCustomerOrder.total.toFixed(2).replace('.', ',')}</p>
                    </div>
                    <div className="text-right">
                      <span className={`text-[10px] font-extrabold uppercase px-3 py-1 rounded-full ${selectedCustomerOrder.customerInfo.paymentMethod === 'pix' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                        Pago em {selectedCustomerOrder.customerInfo.paymentMethod}
                      </span>
                      {selectedCustomerOrder.coupon && (
                        <div className="mt-2 text-xs font-bold text-rose-500">
                          🎟️ Cupom {selectedCustomerOrder.coupon.code}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Itens do Pedido */}
                  <div>
                    <h4 className="font-bold text-stone-700 mb-3 text-sm flex items-center gap-2">
                      <ShoppingBag size={16} className="text-stone-400" /> Itens Consumidos
                    </h4>
                    <div className="space-y-3">
                      {selectedCustomerOrder.pizzas.map((p, i) => (
                        <div key={i} className="bg-stone-50 p-3 rounded-xl border border-stone-100">
                          <div className="flex justify-between items-start mb-1">
                            <span className="font-bold text-stone-800 text-sm">
                              Pizza {p.size} {p.bordaType === 'recheada' ? '(Borda Recheada)' : ''}
                            </span>
                            <span className="text-xs font-bold text-stone-500">
                              R$ {(p.sizePrice + p.bordaPrice).toFixed(2).replace('.', ',')}
                            </span>
                          </div>
                          <p className="text-xs text-stone-500 font-medium">
                            {p.type === 'whole' ?
                              `Sabor: ${p.whole?.name}` :
                              `Metades: ${p.half1?.name} e ${p.half2?.name}`
                            }
                          </p>
                        </div>
                      ))}

                      {selectedCustomerOrder.refrigerantes.map((r, i) => (
                        <div key={i} className="flex items-center justify-between bg-stone-50 p-3 rounded-xl border border-stone-100">
                          <span className="font-medium text-stone-700 text-sm flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-rose-400"></div> {r.name}
                          </span>
                          <span className="text-xs font-bold text-stone-500">
                            R$ {Number(r.price).toFixed(2).replace('.', ',')}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Info de Entrega */}
                  {selectedCustomerOrder.customerInfo.orderType === 'entrega' && (
                    <div className="border-t border-stone-100 pt-6">
                      <h4 className="font-bold text-stone-700 mb-3 text-sm flex items-center gap-2">
                        <MapPin size={16} className="text-stone-400" /> Endereço Entregue
                      </h4>
                      <div className="bg-stone-50 p-4 rounded-xl border border-stone-100 text-sm text-stone-600 space-y-1">
                        <p><strong>Rua:</strong> {selectedCustomerOrder.customerInfo.rua}, {selectedCustomerOrder.customerInfo.numero}</p>
                        <p><strong>Bairro:</strong> {selectedCustomerOrder.customerInfo.bairro}</p>
                        {selectedCustomerOrder.customerInfo.reference && (
                          <p><strong>Referência:</strong> {selectedCustomerOrder.customerInfo.reference}</p>
                        )}
                      </div>
                    </div>
                  )}

                </div>
              </div>
            </div>
          )
        }

        {/* ORDERS TAB */}
        {
          activeTab === 'orders' && (
            <main className="flex-1 p-6 md:p-10 max-w-7xl mx-auto w-full no-print animate-in fade-in slide-in-from-left-4 duration-300">

              <div className="flex justify-end mb-4">
                <button
                  onClick={() => {
                    const audio = new Audio(NOTIFICATION_SOUND);
                    audio.volume = 1.0;
                    audio.play();
                  }}
                  className="text-xs font-bold bg-stone-200 hover:bg-stone-300 px-4 py-2 rounded-xl transition-colors flex items-center gap-2 text-stone-600"
                >
                  🔊 Testar Som
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Coluna Pedidos Pendentes */}
                <div className="lg:col-span-2 space-y-6">
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-serif font-bold text-stone-800 flex items-center gap-2">
                      <Clock className="text-rose-500" /> Pendentes ({pendingOrders.length})
                    </h2>
                    <div className="bg-rose-100 text-rose-700 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider animate-pulse">
                      Monitorando novos pedidos...
                    </div>
                  </div>

                  {pendingOrders.length === 0 ? (
                    <div className="bg-white rounded-[2rem] p-12 text-center border border-stone-200 shadow-sm">
                      <Bell size={48} className="mx-auto text-stone-300 mb-4" />
                      <p className="text-stone-500 font-bold uppercase text-xs tracking-widest">Nenhum pedido pendente no momento</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {pendingOrders.map(o => (
                        <div key={o.id} className="bg-white rounded-[2rem] p-6 shadow-sm border border-stone-200 hover:shadow-md transition-shadow">
                          <div className="flex flex-col sm:flex-row justify-between gap-4 border-b border-stone-100 pb-4 mb-4">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-[10px] font-black bg-stone-100 px-2 py-0.5 rounded text-stone-500 tracking-tighter">#{o.id.toUpperCase()}</span>
                                <span className="text-stone-400 text-[10px] font-bold uppercase">{new Date(o.createdAt).toLocaleTimeString()}</span>
                              </div>
                              <h3 className="text-lg font-bold text-stone-800">{o.customerInfo.name}</h3>
                              <p className="text-stone-500 text-xs font-medium flex items-center gap-1">
                                {o.customerInfo.orderType === 'entrega' ? <MapPin size={12} /> : <ShoppingBag size={12} />}
                                {o.customerInfo.orderType === 'entrega' ? `${o.customerInfo.rua}, ${o.customerInfo.numero} - ${o.customerInfo.bairro}` : 'Vou Retirar'}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-stone-400 text-[10px] font-bold uppercase">Total</p>
                              <p className="text-xl font-serif font-bold text-rose-600">R$ {o.total.toFixed(2).replace('.', ',')}</p>
                              <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${o.customerInfo.paymentMethod === 'pix' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                                {o.customerInfo.paymentMethod}
                              </span>
                            </div>
                          </div>

                          <div className="mb-6 space-y-2">
                            {o.pizzas.map((p, i) => (
                              <div key={i} className="text-xs font-semibold text-stone-700 bg-stone-50 p-2 rounded-xl border border-stone-100">
                                <span className="text-rose-600 mr-2">#{i + 1}</span>
                                Pizza {p.size} ({p.type === 'whole' ? p.whole?.name : `${p.half1?.name}/${p.half2?.name}`})
                                {p.bordaType === 'recheada' && <span className="ml-2 text-rose-500">Borda Rec.</span>}
                              </div>
                            ))}
                            {o.refrigerantes.length > 0 && (
                              <div className="text-xs text-stone-500 flex flex-wrap gap-2 px-2">
                                {o.refrigerantes.map(r => <span key={r.name}>&bull; {r.name}</span>)}
                              </div>
                            )}
                            {o.customerInfo.observations && (
                              <div className="mt-2 text-[10px] bg-amber-50 text-amber-800 p-2 rounded-lg border border-amber-100 font-medium">
                                <strong>OBS:</strong> {o.customerInfo.observations}
                              </div>
                            )}
                          </div>

                          <div className="flex flex-col gap-2">
                            <div className="flex flex-col sm:flex-row flex-wrap gap-2 mb-2">
                              <button
                                onClick={() => changeOrderStatus(o.id, 'accepted')}
                                className={`w-full sm:flex-1 py-3 sm:py-2 rounded-xl text-xs font-bold transition-all ${o.status === 'accepted' || o.status === 'preparing' || o.status === 'delivering' || o.status === 'completed' ? 'bg-blue-100 text-blue-700' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'}`}
                              >
                                Aceito
                              </button>
                              <button
                                onClick={() => changeOrderStatus(o.id, 'preparing')}
                                className={`w-full sm:flex-1 py-3 sm:py-2 rounded-xl text-xs font-bold transition-all ${o.status === 'preparing' || o.status === 'delivering' || o.status === 'completed' ? 'bg-orange-100 text-orange-700' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'}`}
                              >
                                Em Preparo
                              </button>
                              <button
                                onClick={() => changeOrderStatus(o.id, 'delivering')}
                                className={`w-full sm:flex-1 py-3 sm:py-2 rounded-xl text-xs font-bold transition-all ${o.status === 'delivering' || o.status === 'completed' ? 'bg-purple-100 text-purple-700' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'}`}
                              >
                                {o.customerInfo.orderType === 'entrega' ? 'Saiu p/ Entrega' : 'Pronto p/ Retirar'}
                              </button>
                            </div>
                            <div className="flex flex-col sm:flex-row flex-wrap gap-2">
                              <button
                                onClick={() => changeOrderStatus(o.id, 'completed')}
                                className="w-full sm:flex-1 min-w-[120px] bg-green-600 text-white py-4 sm:py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 hover:bg-green-700 active:scale-95 transition-all shadow-lg shadow-green-100"
                              >
                                <CheckCircle size={16} /> Concluir Pedido
                              </button>
                              <button
                                onClick={() => printOrder(o)}
                                className="w-full sm:flex-1 min-w-[120px] bg-stone-800 text-white py-4 sm:py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 hover:bg-stone-700 active:scale-95 transition-all"
                              >
                                <Printer size={16} /> Imprimir
                              </button>
                              <button
                                onClick={() => deleteOrder(o.id)}
                                className="w-full sm:w-auto p-4 sm:p-3 bg-red-100 text-red-600 flex justify-center items-center rounded-xl hover:bg-red-200 transition-colors"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Coluna Histórico / Concluídos */}
                <div className="space-y-6">
                  <h2 className="text-2xl font-serif font-bold text-stone-800 flex items-center gap-2">
                    <CheckCircle2 className="text-green-500" /> Histórico ({completedOrders.length})
                  </h2>
                  <div className="bg-white rounded-[2rem] border border-stone-200 overflow-hidden">
                    {completedOrders.length === 0 ? (
                      <div className="p-8 text-center text-stone-400 text-xs font-bold uppercase">Nenhum pedido concluído</div>
                    ) : (
                      <div className="divide-y divide-stone-100">
                        {completedOrders.map(o => (
                          <div key={o.id} onClick={() => setSelectedHistoryOrder(o)} className="p-4 hover:bg-stone-50 transition-colors group cursor-pointer">
                            <div className="flex justify-between items-start mb-1">
                              <span className="text-stone-800 font-bold text-xs">{o.customerInfo.name}</span>
                              <span className="text-stone-400 text-[9px] font-bold">{new Date(o.createdAt).toLocaleDateString()}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-stone-500 text-[10px] font-semibold">R$ {o.total.toFixed(2)}</span>
                              <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={(e) => { e.stopPropagation(); printOrder(o); }} className="text-stone-400 hover:text-stone-800"><Printer size={14} /></button>
                                <button onClick={(e) => { e.stopPropagation(); deleteOrder(o.id); }} className="text-stone-400 hover:text-red-600"><Trash2 size={14} /></button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

              </div>

              {/* HISTORY ORDER MODAL */}
              {selectedHistoryOrder && (
                <div className="fixed inset-0 z-[70] bg-stone-900/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-300">
                  <div className="bg-white rounded-[2rem] w-full max-w-lg max-h-[80vh] flex flex-col shadow-2xl overflow-hidden">
                    <div className="p-6 border-b border-stone-100 flex justify-between items-center bg-stone-50">
                      <div>
                        <h3 className="text-xl font-bold text-stone-800 font-serif">Detalhes do Histórico</h3>
                        <p className="text-stone-500 text-xs font-bold uppercase tracking-widest mt-1">
                          #{selectedHistoryOrder.id.toUpperCase()} • {new Date(selectedHistoryOrder.createdAt).toLocaleString('pt-BR')}
                        </p>
                      </div>
                      <button
                        onClick={() => setSelectedHistoryOrder(null)}
                        className="p-2 hover:bg-stone-200 rounded-full transition-colors bg-white border border-stone-200 shadow-sm"
                      >
                        <X size={20} className="text-stone-500" />
                      </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                      {/* Resumo Financeiro */}
                      <div className="bg-rose-50 rounded-2xl p-4 border border-rose-100 flex justify-between items-center">
                        <div>
                          <p className="text-xs font-bold text-rose-600 uppercase tracking-widest mb-1">Total do Pedido</p>
                          <p className="text-2xl font-serif font-black text-rose-700">R$ {selectedHistoryOrder.total.toFixed(2).replace('.', ',')}</p>
                        </div>
                        <div className="text-right">
                          <span className={`text-[10px] font-extrabold uppercase px-3 py-1 rounded-full ${selectedHistoryOrder.customerInfo.paymentMethod === 'pix' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                            Pago em {selectedHistoryOrder.customerInfo.paymentMethod}
                          </span>
                          {selectedHistoryOrder.coupon && (
                            <div className="mt-2 text-xs font-bold text-rose-500">
                              🎟️ Cupom {selectedHistoryOrder.coupon.code}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Cliente e Tipo */}
                      <div className="bg-stone-50 rounded-2xl p-4 border border-stone-100">
                        <div className="flex justify-between items-start border-b border-stone-200 pb-3 mb-3">
                          <div>
                            <p className="font-bold text-stone-800 text-sm flex items-center gap-2">
                              <Users size={14} className="text-stone-400" /> {selectedHistoryOrder.customerInfo.name}
                            </p>
                            <p className="text-xs text-stone-500 font-mono mt-1">{selectedHistoryOrder.customerInfo.phone}</p>
                          </div>
                          <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase flex items-center gap-1 border ${selectedHistoryOrder.customerInfo.orderType === 'entrega' ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-stone-800 text-white border-stone-800'}`}>
                            {selectedHistoryOrder.customerInfo.orderType === 'entrega' ? <MapPin size={10} /> : <ShoppingBag size={10} />}
                            {selectedHistoryOrder.customerInfo.orderType}
                          </div>
                        </div>
                        {selectedHistoryOrder.customerInfo.orderType === 'entrega' && (
                          <div className="text-xs text-stone-600 space-y-1">
                            <p><strong>Endereço:</strong> {selectedHistoryOrder.customerInfo.rua}, {selectedHistoryOrder.customerInfo.numero} - {selectedHistoryOrder.customerInfo.bairro}</p>
                            {selectedHistoryOrder.customerInfo.reference && <p><strong>Ref:</strong> {selectedHistoryOrder.customerInfo.reference}</p>}
                          </div>
                        )}
                        {selectedHistoryOrder.customerInfo.observations && (
                          <div className="mt-3 p-2 bg-amber-50 text-amber-800 text-[10px] rounded-lg border border-amber-100 font-medium">
                            <strong>Obs do Cliente:</strong> {selectedHistoryOrder.customerInfo.observations}
                          </div>
                        )}
                      </div>

                      {/* Itens do Pedido */}
                      <div>
                        <h4 className="font-bold text-stone-700 mb-3 text-sm flex items-center gap-2">
                          <Pizza size={16} className="text-stone-400" /> Itens do Pedido
                        </h4>
                        <div className="space-y-3">
                          {selectedHistoryOrder.pizzas.map((p, i) => (
                            <div key={i} className="bg-stone-50 p-3 rounded-xl border border-stone-100">
                              <div className="flex justify-between items-start mb-1">
                                <span className="font-bold text-stone-800 text-sm">
                                  Pizza {p.size} {p.bordaType === 'recheada' ? '(Borda Recheada)' : ''}
                                </span>
                                <span className="text-xs font-bold text-stone-500">
                                  R$ {(p.sizePrice + p.bordaPrice).toFixed(2).replace('.', ',')}
                                </span>
                              </div>
                              <p className="text-xs text-stone-500 font-medium">
                                {p.type === 'whole' ?
                                  `Sabor: ${p.whole?.name}` :
                                  `Metades: ${p.half1?.name} e ${p.half2?.name}`
                                }
                              </p>
                            </div>
                          ))}

                          {selectedHistoryOrder.refrigerantes.map((r, i) => (
                            <div key={i} className="flex items-center justify-between bg-stone-50 p-3 rounded-xl border border-stone-100">
                              <span className="font-medium text-stone-700 text-sm flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-rose-400"></div> {r.name}
                              </span>
                              <span className="text-xs font-bold text-stone-500">
                                R$ {Number(r.price).toFixed(2).replace('.', ',')}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

            </main>
          )
        }
      </div >
    );
  }

  // LOGIN SCREEN
  if (viewMode === 'admin-login') {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="bg-white border border-stone-200 rounded-[2.5rem] p-10 max-w-sm w-full shadow-2xl text-center">
          <div className="w-20 h-20 bg-stone-100 text-stone-800 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-inner border-2 border-stone-200">
            <LogIn size={36} />
          </div>
          <h2 className="text-3xl font-serif font-bold text-stone-800 mb-2">Login Admin</h2>
          <p className="text-stone-500 text-xs font-bold uppercase tracking-widest mb-8">Chalé Pizzaria</p>

          <div className="space-y-4 mb-6">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-stone-50 border border-stone-200 rounded-2xl px-6 py-4 outline-none font-medium text-stone-800"
            />
            <input
              type="password"
              placeholder="Senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-stone-50 border border-stone-200 rounded-2xl px-6 py-4 outline-none font-medium text-stone-800"
            />
          </div>

          <button
            onClick={handleAdminLogin}
            disabled={loading}
            className="w-full bg-stone-800 text-white py-5 rounded-2xl font-bold flex items-center justify-center gap-3 hover:bg-stone-700 transition-all active:scale-95 shadow-xl shadow-stone-200 disabled:opacity-50"
          >
            {loading ? 'Entrando...' : 'Acessar Painel'}
          </button>

          <button
            onClick={() => setViewMode('customer')}
            className="mt-4 text-stone-400 text-[10px] font-extrabold uppercase hover:text-rose-600 transition-colors"
          >
            Voltar para o Cardápio
          </button>
        </div>
      </div>
    );
  }

  // CUSTOMER FLOW
  if (isFinished) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-12">
        <div className="bg-white/90 backdrop-blur-sm border border-stone-200 rounded-[3rem] p-12 max-w-lg w-full text-center shadow-2xl shadow-stone-200 animate-in zoom-in fade-in duration-500">
          {(() => {
            let statusIcon = <Loader2 size={48} className="animate-spin" />;
            let statusColor = 'bg-stone-50 text-stone-600 ring-stone-100/50';
            let statusTitle = 'Aguardando Confirmação...';
            let statusDesc = 'Já recebemos seu pedido. Aguarde a confirmação da pizzaria.';

            if (orderStatus === 'accepted') {
              statusIcon = <CheckCircle size={48} />;
              statusColor = 'bg-blue-50 text-blue-600 ring-blue-100/50';
              statusTitle = 'Pedido Aceito!';
              statusDesc = 'Seu pedido foi aceito e logo entrará em preparo.';
            } else if (orderStatus === 'preparing') {
              statusIcon = <Pizza size={48} className="animate-pulse" />;
              statusColor = 'bg-orange-50 text-orange-600 ring-orange-100/50';
              statusTitle = 'Em Preparo...';
              statusDesc = 'Sua pizza já está no forno! Sendo preparada com todo carinho.';
            } else if (orderStatus === 'delivering') {
              statusIcon = order.customerInfo.orderType === 'entrega' ? <MapPin size={48} className="animate-bounce" /> : <ShoppingBag size={48} />;
              statusColor = 'bg-purple-50 text-purple-600 ring-purple-100/50';
              statusTitle = order.customerInfo.orderType === 'entrega' ? 'Saiu para Entrega!' : 'Pronto para Retirar!';
              statusDesc = order.customerInfo.orderType === 'entrega' ? 'O entregador já está a caminho com o seu pedido.' : 'Pode vir buscar sua pizza quentinha!';
            } else if (orderStatus === 'completed') {
              statusIcon = <Heart size={48} className="fill-green-600" />;
              statusColor = 'bg-green-50 text-green-600 ring-green-100/50';
              statusTitle = 'Pedido Finalizado!';
              statusDesc = 'Agradecemos a preferência e esperamos que goste!';
            }

            return (
              <>
                <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner ring-8 transition-colors duration-500 ${statusColor}`}>
                  {statusIcon}
                </div>
                <h2 className="text-4xl font-serif font-bold text-stone-800 mb-4 transition-all">
                  {statusTitle}
                </h2>
                <div className="flex gap-1 justify-center mb-6 max-w-xs mx-auto">
                  <div className={`h-2 flex-1 rounded-full ${orderStatus !== 'pending' ? 'bg-green-500' : 'bg-stone-200'}`}></div>
                  <div className={`h-2 flex-1 rounded-full ${orderStatus === 'preparing' || orderStatus === 'delivering' || orderStatus === 'completed' ? 'bg-green-500' : 'bg-stone-200'}`}></div>
                  <div className={`h-2 flex-1 rounded-full ${orderStatus === 'delivering' || orderStatus === 'completed' ? 'bg-green-500' : 'bg-stone-200'}`}></div>
                  <div className={`h-2 flex-1 rounded-full ${orderStatus === 'completed' ? 'bg-green-500' : 'bg-stone-200'}`}></div>
                </div>
                <p className="text-stone-600 font-medium mb-12 leading-relaxed h-12 flex items-center justify-center">
                  {statusDesc}
                </p>
              </>
            );
          })()}
          <div className="flex flex-col gap-3">
            <button
              onClick={handleReset}
              className="w-full bg-stone-800 text-white font-bold py-5 rounded-3xl flex items-center justify-center gap-3 shadow-xl hover:bg-stone-700 transition-all hover:scale-[1.02] active:scale-95 group"
            >
              <RotateCcw size={20} className="group-hover:rotate-180 transition-transform duration-500" />
              Fazer Novo Pedido
            </button>
            <button
              onClick={() => {
                if (orderStatus === 'completed') {
                  localStorage.removeItem('chalé_tracking_order_id');
                  setSubmittedOrderId(null);
                }
                closeTracker();
              }}
              className="w-full bg-stone-100 text-stone-600 font-bold py-4 rounded-3xl hover:bg-stone-200 transition-colors"
            >
              Fechar Acompanhamento
            </button>
          </div>
        </div>
      </div>
    );
  }

  // LANDING SCREEEN
  if (viewMode === 'landing') {
    return (
      <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-black no-print">
        {/* Animated Hero Background */}
        <ImageSequenceHero imagesCount={80} />

        {/* Content Overlay */}
        <div className="relative z-10 flex flex-col items-center justify-center text-center p-6 w-full h-full">
          <div className="bg-rose-600 p-5 rounded-[2rem] mb-8 shadow-2xl animate-in zoom-in duration-700">
            <Pizza className="text-white w-20 h-20" />
          </div>

          <h1 className="text-6xl md:text-8xl font-serif font-black text-white mb-6 drop-shadow-2xl tracking-tight animate-in slide-in-from-bottom-8 duration-700 delay-150 fill-mode-both">
            <span className="text-rose-500 block sm:inline">Chalé</span> Pizzaria
          </h1>

          <p className="text-stone-200 text-lg md:text-2xl font-medium tracking-wide mb-12 drop-shadow-md max-w-2xl animate-in slide-in-from-bottom-8 duration-700 delay-300 fill-mode-both">
            A melhor pizza da região, feita com carinho e entregue quentinha na sua casa.
          </p>

          <button
            onClick={() => setViewMode('customer')}
            className="group bg-rose-600 text-white px-12 py-5 rounded-full text-xl md:text-2xl font-bold hover:bg-rose-700 hover:scale-105 transition-all outline-none focus:ring-4 focus:ring-rose-500/50 shadow-[0_0_40px_-10px_rgba(225,29,72,0.8)] active:scale-95 flex items-center gap-4 animate-in slide-in-from-bottom-8 duration-700 delay-500 fill-mode-both"
          >
            <ShoppingBag size={28} className="group-hover:animate-bounce" />
            Fazer Pedido
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* STORE CLOSED OVERLAY */}
      {!storeSettings.isOpen && !isSettingsLoading && viewMode !== 'admin-login' && viewMode !== 'admin-dashboard' && (
        <div className="fixed inset-0 z-[100] bg-[#fcfaf7] flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-500">
          <div className="w-24 h-24 bg-stone-200 rounded-full flex items-center justify-center mb-8 shadow-inner">
            <Clock size={48} className="text-stone-500" />
          </div>
          <h1 className="text-4xl font-serif font-bold text-stone-800 mb-2">Chalé Pizzaria</h1>
          <div className="w-16 h-1 bg-rose-600 rounded-full mb-8"></div>

          <h2 className="text-2xl font-serif text-stone-700 max-w-2xl leading-relaxed">
            {storeSettings.closedMessage}
          </h2>

          <div className="mt-12 text-stone-400 text-xs font-bold uppercase tracking-[0.2em] flex flex-col gap-4">
            <span>Horário de Funcionamento</span>
            <div className="flex items-center justify-center gap-2">
              <Store size={14} />
              <span>{storeSettings.businessHours}</span>
            </div>
          </div>

          <button
            onClick={() => setViewMode('admin-login')}
            className="absolute bottom-6 right-6 text-stone-300 hover:text-stone-400 p-2 transition-colors"
          >
            <Lock size={12} />
          </button>
        </div>
      )}

      <header className="bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-stone-200 py-4 no-print shadow-sm">
        <div className="container mx-auto px-6 flex justify-between items-center relative">
          <div className="flex items-center gap-3">
            <div className="bg-rose-600 p-2 rounded-xl">
              <Pizza className="text-white w-6 h-6" />
            </div>
            <h1 className="text-2xl font-serif font-bold text-stone-800"><span className="text-rose-600">Chalé</span> Pizzaria</h1>
          </div>

          <div className="flex items-center gap-2">
            {submittedOrderId && orderStatus !== 'completed' && (
              <button
                onClick={() => setIsFinished(true)}
                className="bg-stone-800 hover:bg-stone-700 text-white px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 shadow-md transition-all animate-pulse shadow-stone-300"
              >
                <Clock size={14} /> Acompanhar Pedido
              </button>
            )}
            <div className="hidden sm:flex items-center gap-2 bg-green-50 px-3 py-1 rounded-full border border-green-100">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              <span className="text-[10px] font-bold uppercase text-green-700">Fazendo Pedidos</span>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto max-w-4xl px-4 py-8 no-print">

        {/* Progress Tracker */}
        <div className="flex justify-center items-center mb-10 gap-4 sm:gap-8 px-2">
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className="flex flex-col items-center gap-2">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs transition-all ${step === s ? 'bg-rose-600 text-white shadow-lg ring-4 ring-rose-100 scale-110' : s < step ? 'bg-green-500 text-white' : 'bg-stone-300 text-stone-600 shadow-sm'}`}>
                {s < step ? <CheckCircle2 size={18} /> : s}
              </div>
              <span className={`text-[9px] font-bold uppercase tracking-widest ${step === s ? 'text-rose-600 font-extrabold' : 'text-stone-500 font-semibold'}`}>
                {s === 1 ? "Pizzas" : s === 2 ? "Bebidas" : s === 3 ? "Dados" : "Resumo"}
              </span>
            </div>
          ))}
        </div>

        {/* JANELA PRINCIPAL */}
        <div className="bg-white/90 backdrop-blur-sm border border-stone-100 rounded-[2.5rem] shadow-xl shadow-stone-200/50 p-6 md:p-12 transition-all">

          {/* PASSO 1: PERSONALIZAR TUDO DA PIZZA */}
          {step === 1 && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                  <h2 className="text-3xl font-serif font-bold text-stone-800">Suas Pizzas</h2>
                  <p className="text-stone-600 text-sm font-medium">Monte cada pizza individualmente.</p>
                </div>

              </div>

              <div className="space-y-6">
                {order.pizzas.map((p, idx) => {
                  const sizeMissing = triedToAdvance && !p.size;
                  const flavorsMissing = triedToAdvance && (p.type === 'whole' ? !p.whole : (!p.half1 || !p.half2));
                  const bPriceForCurrentSize = p.size ? (((storeSettings.pizzaSizes && storeSettings.pizzaSizes.length > 0) ? storeSettings.pizzaSizes : SIZE_OPTIONS).find((s: any) => s.size === p.size)?.bordaPrice ?? storeSettings.bordaPrices[p.size] ?? 0) : 0;

                  return (
                    <div key={p.id} className={`p-6 md:p-8 rounded-[2rem] border-2 transition-all bg-stone-50/20 ${sizeMissing || flavorsMissing ? 'border-red-400 ring-4 ring-red-50' : 'border-stone-200 shadow-sm'}`}>
                      <div className="flex justify-between items-center mb-8 pb-4 border-b border-stone-200">
                        <div className="flex items-center gap-3">
                          <span className="w-8 h-8 rounded-lg bg-rose-600 text-white flex items-center justify-center font-bold text-sm">0{idx + 1}</span>
                          <h3 className="font-bold text-stone-800 uppercase tracking-widest text-xs">Configurar Pizza</h3>
                        </div>
                        {order.pizzas.length > 1 && (
                          <button onClick={() => removePizza(p.id)} className="text-stone-400 hover:text-red-500 transition-colors"><Trash2 size={20} /></button>
                        )}
                      </div>

                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                        {/* Tamanho e Borda */}
                        <div className="space-y-8">
                          <div>
                            <div className="flex justify-between items-end mb-4">
                              <label className={`text-[10px] font-bold uppercase tracking-[0.2em] block ${sizeMissing ? 'text-red-500' : 'text-stone-600'}`}>1. Escolha o Tamanho *</label>
                              {sizeMissing && <span className="text-[9px] text-red-500 font-bold uppercase animate-pulse">Obrigatório</span>}
                            </div>
                            <div className={`grid grid-cols-2 sm:grid-cols-4 gap-2 p-1 rounded-2xl transition-all ${sizeMissing ? 'bg-red-50' : ''}`}>
                              {((storeSettings.pizzaSizes && storeSettings.pizzaSizes.length > 0) ? storeSettings.pizzaSizes : SIZE_OPTIONS).map((opt: any) => (
                                <button
                                  key={opt.size}
                                  onClick={() => updatePizza(p.id, { size: opt.size, sizePrice: opt.price, bordaPrice: p.bordaType === 'recheada' ? (opt.bordaPrice ?? storeSettings.bordaPrices[opt.size] ?? 0) : 0 })}
                                  className={`py-2 px-1 h-auto min-h-[70px] rounded-xl border-2 font-bold transition-all text-xs flex flex-col items-center justify-center gap-1 ${p.size === opt.size ? 'border-rose-600 bg-rose-50 text-rose-600 shadow-sm' : 'border-stone-300 bg-white text-stone-700 hover:border-rose-400'}`}
                                >
                                  <span className="text-sm font-black">{opt.size}</span>
                                  {(opt.fatias || opt.diameter) && (
                                    <span className="text-[9px] text-stone-500 font-medium text-center leading-tight">
                                      {opt.fatias} {opt.fatias && opt.diameter && <br />} {opt.diameter}
                                    </span>
                                  )}
                                  <span className="text-[10px] text-green-600 font-extrabold bg-green-50/50 px-1.5 py-0.5 rounded-md mt-0.5 shadow-sm">
                                    R$ {Number(opt.price).toFixed(2).replace('.', ',')}
                                  </span>
                                </button>
                              ))}
                            </div>
                          </div>

                          <div>
                            <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-stone-600 block mb-4">2. Borda Recheada?</label>
                            <div className="flex gap-2">
                              <button
                                onClick={() => updatePizza(p.id, { bordaType: 'normal', bordaPrice: 0 })}
                                className={`flex-1 py-3 rounded-xl border-2 font-bold transition-all text-xs ${p.bordaType === 'normal' ? 'border-stone-800 bg-stone-800 text-white shadow-md' : 'border-stone-300 bg-white text-stone-700 hover:border-stone-500'}`}
                              >
                                Não
                              </button>
                              <button
                                disabled={!p.size}
                                onClick={() => updatePizza(p.id, { bordaType: 'recheada', bordaPrice: bPriceForCurrentSize })}
                                className={`flex-1 py-3 rounded-xl border-2 font-bold transition-all text-xs ${p.bordaType === 'recheada' ? 'border-rose-600 bg-rose-600 text-white shadow-lg shadow-rose-100' : 'border-stone-300 bg-stone-100 text-stone-500 disabled:opacity-30'}`}
                              >
                                Sim {p.size && `(+R$${Number(bPriceForCurrentSize).toFixed(2).replace('.', ',')})`}
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Sabores */}
                        <div className="space-y-6">
                          <div>
                            <div className="flex justify-between items-center mb-4">
                              <div className="flex flex-col gap-1">
                                <label className={`text-[10px] font-bold uppercase tracking-[0.2em] ${flavorsMissing ? 'text-red-500' : 'text-stone-600'}`}>3. Sabor(es) *</label>
                                {flavorsMissing && <span className="text-[9px] text-red-500 font-bold uppercase animate-pulse">Selecione o sabor</span>}
                              </div>
                              <div className="bg-stone-100 p-1 rounded-lg flex gap-1 shadow-sm border border-stone-300">
                                <button onClick={() => updatePizza(p.id, { type: 'whole' })} className={`px-4 py-1 rounded-md text-[10px] font-bold transition-all ${p.type === 'whole' ? 'bg-stone-800 text-white shadow-sm' : 'text-stone-600 hover:text-stone-900 font-bold'}`}>Inteira</button>
                                <button onClick={() => updatePizza(p.id, { type: 'half' })} className={`px-4 py-1 rounded-md text-[10px] font-bold transition-all ${p.type === 'half' ? 'bg-stone-800 text-white shadow-sm' : 'text-stone-600 hover:text-stone-900 font-bold'}`}>Meia</button>
                              </div>
                            </div>

                            {!p.size ? (
                              <div className="bg-white border-2 border-dashed border-stone-300 rounded-2xl py-12 text-center text-stone-500 text-[10px] font-bold uppercase tracking-widest">Selecione o tamanho primeiro</div>
                            ) : p.type === 'whole' ? (
                              <button
                                onClick={() => setModalConfig({ isOpen: true, pizzaId: p.id, type: 'whole', halfNum: null })}
                                className={`w-full p-6 rounded-2xl border-2 border-dashed transition-all text-center group ${p.whole ? 'border-rose-300 bg-white' : flavorsMissing ? 'border-red-400 bg-red-50 shadow-inner ring-4 ring-red-100' : 'border-stone-400 bg-white hover:border-rose-500 shadow-sm'}`}
                              >
                                {p.whole ? (
                                  <div className="animate-in zoom-in duration-300">
                                    <span className="font-bold text-rose-600 block">{p.whole.name}</span>
                                    <span className="text-[10px] text-stone-600 font-semibold">{p.whole.ingredients}</span>
                                  </div>
                                ) : (
                                  <div className={`flex flex-col items-center gap-1 group-hover:text-rose-700 ${flavorsMissing ? 'text-red-500' : 'text-stone-600'}`}>
                                    <Plus size={24} />
                                    <span className="text-[10px] font-bold uppercase">Escolher Sabor</span>
                                  </div>
                                )}
                              </button>
                            ) : (
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <button onClick={() => setModalConfig({ isOpen: true, pizzaId: p.id, type: 'half', halfNum: 1 })} className={`p-4 rounded-2xl border-2 border-dashed transition-all text-center bg-white ${p.half1 ? 'border-rose-400 shadow-sm' : flavorsMissing ? 'border-red-400 bg-red-50 shadow-inner text-red-500' : 'border-stone-400 hover:border-rose-500 text-stone-600 hover:text-rose-700 font-bold'}`}>
                                  {p.half1 ? <span className="font-bold text-rose-600 text-xs">{p.half1.name}</span> : <span className="text-[10px] font-bold uppercase">+ Metade 1</span>}
                                </button>
                                <button onClick={() => setModalConfig({ isOpen: true, pizzaId: p.id, type: 'half', halfNum: 2 })} className={`p-4 rounded-2xl border-2 border-dashed transition-all text-center bg-white ${p.half2 ? 'border-rose-400 shadow-sm' : flavorsMissing ? 'border-red-400 bg-red-50 shadow-inner text-red-500' : 'border-stone-400 hover:border-rose-500 text-stone-600 hover:text-rose-700 font-bold'}`}>
                                  {p.half2 ? <span className="font-bold text-rose-600 text-xs">{p.half2.name}</span> : <span className="text-[10px] font-bold uppercase">+ Metade 2</span>}
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-center mt-6">
                <button
                  onClick={addPizza}
                  className="bg-stone-800 text-white px-6 py-3 rounded-2xl text-xs font-bold hover:bg-stone-700 transition-all flex items-center justify-center gap-2 shadow-lg active:scale-95"
                >
                  <Plus size={18} /> Adicionar Outra Pizza
                </button>
              </div>

              {/* MODAL DE SABORES */}
              {modalConfig.isOpen && (
                <div className="fixed inset-0 z-[60] bg-stone-900/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-300">
                  <div className="bg-white rounded-[2rem] w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl">
                    <div className="p-6 border-b border-stone-100 flex justify-between items-center">
                      <div>
                        <h3 className="text-xl font-bold text-stone-800 font-serif">Escolha o Sabor</h3>
                        <p className="text-stone-500 text-xs font-bold uppercase tracking-widest">
                          {modalConfig.type === 'whole' ? 'Pizza Inteira' : `Metade ${modalConfig.halfNum}`}
                        </p>
                      </div>
                      <button onClick={() => setModalConfig({ ...modalConfig, isOpen: false })} className="p-2 hover:bg-stone-100 rounded-full transition-colors">
                        <X size={24} className="text-stone-400" />
                      </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 space-y-3 custom-scrollbar">
                      {menuLoading ? (
                        <div className="flex flex-col items-center justify-center py-12 text-stone-400 gap-3">
                          <Loader2 className="animate-spin text-rose-500" size={32} />
                          <span className="font-bold text-sm">Carregando sabores...</span>
                        </div>
                      ) : flavorsList.length === 0 ? (
                        <div className="text-center py-12 text-stone-400 font-bold text-sm">
                          Nenhum sabor disponível no momento.
                        </div>
                      ) : (
                        flavorsList.map((flavor) => (
                          <button
                            key={flavor.id}
                            onClick={() => {
                              updatePizza(modalConfig.pizzaId, {
                                [modalConfig.type === 'whole' ? 'whole' : modalConfig.halfNum === 1 ? 'half1' : 'half2']: flavor
                              });
                              setModalConfig({ ...modalConfig, isOpen: false });
                            }}
                            className="w-full text-left p-4 rounded-xl hover:bg-rose-50 border border-stone-100 hover:border-rose-200 transition-all group"
                          >
                            <div className="flex justify-between items-center mb-1">
                              <span className="font-bold text-stone-700 group-hover:text-rose-700">{flavor.name}</span>
                              <ChevronRight size={16} className="text-stone-300 group-hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-all" />
                            </div>
                            <p className="text-xs text-stone-500 leading-relaxed font-medium">{flavor.ingredients}</p>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* PASSO 2: BEBIDAS */}
          {step === 2 && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="text-center mb-10">
                <h2 className="text-3xl font-serif font-bold text-stone-800">Bebidas</h2>
                <p className="text-stone-600 text-sm font-medium">Deseja acompanhar sua pizza com algo?</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl mx-auto">
                {menuLoading ? (
                  <div className="col-span-3 flex flex-col items-center justify-center py-12 text-stone-400 gap-3">
                    <Loader2 className="animate-spin text-rose-500" size={32} />
                    <span className="font-bold text-sm">Carregando bebidas...</span>
                  </div>
                ) : beveragesList.length === 0 ? (
                  <div className="col-span-3 text-center py-12 text-stone-400 font-bold text-sm">
                    Nenhuma bebida disponível no momento.
                  </div>
                ) : (
                  beveragesList.map(r => {
                    const quantity = order.refrigerantes.filter(item => item.name === r.name).length;

                    return (
                      <div
                        key={r.id}
                        className={`flex flex-col items-center p-6 rounded-3xl border-2 transition-all ${quantity > 0 ? 'border-rose-600 bg-rose-50 shadow-lg' : 'border-stone-200 bg-white text-stone-700 shadow-sm'}`}
                      >
                        <span className="font-bold text-stone-800 mb-1">{r.name}</span>
                        <span className="text-rose-600 font-bold text-sm mb-6">R$ {parseFloat(r.price).toFixed(2)}</span>

                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => setOrder(prev => {
                              const index = prev.refrigerantes.findIndex(item => item.name === r.name);
                              if (index === -1) return prev;
                              const newRefri = [...prev.refrigerantes];
                              newRefri.splice(index, 1);
                              return { ...prev, refrigerantes: newRefri };
                            })}
                            disabled={quantity === 0}
                            className={`w-10 h-10 rounded-xl flex items-center justify-center border-2 transition-all ${quantity > 0 ? 'border-stone-300 bg-white text-stone-800 hover:bg-stone-100 hover:border-stone-400' : 'border-stone-100 bg-stone-50 text-stone-300 cursor-not-allowed'}`}
                          >
                            <Minus size={16} />
                          </button>

                          <div className="w-8 text-center font-bold text-lg text-stone-800">
                            {quantity}
                          </div>

                          <button
                            onClick={() => setOrder(prev => ({
                              ...prev,
                              refrigerantes: [...prev.refrigerantes, { name: r.name, price: parseFloat(r.price) }]
                            }))}
                            className="w-10 h-10 rounded-xl bg-stone-800 text-white flex items-center justify-center hover:bg-stone-700 active:scale-95 transition-all shadow-lg shadow-stone-200"
                          >
                            <Plus size={16} />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* PASSO 3: DADOS */}
          {step === 3 && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-2xl mx-auto">
              <div className="text-center mb-10">
                <h2 className="text-3xl font-serif font-bold text-stone-800">Dados do Pedido</h2>
                <p className="text-stone-600 text-sm font-medium">Quase lá! Só precisamos saber para onde enviar.</p>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="flex justify-between mb-2">
                      <label className={`text-[10px] font-bold uppercase tracking-widest block ${triedToAdvance && order.customerInfo.phone.replace(/\D/g, '').length < 10 ? 'text-red-500' : 'text-stone-600'}`}>Telefone / WhatsApp *</label>
                      {triedToAdvance && order.customerInfo.phone.replace(/\D/g, '').length < 10 && <span className="text-[9px] text-red-500 font-bold uppercase animate-pulse">Campo obrigatório</span>}
                    </div>
                    <input
                      type="tel"
                      value={order.customerInfo.phone}
                      onChange={async e => {
                        let val = e.target.value.replace(/\D/g, '');
                        if (val.length > 11) val = val.substring(0, 11);

                        let formatted = val;
                        if (val.length > 2) {
                          formatted = `(${val.substring(0, 2)}) `;
                          if (val.length > 7) {
                            formatted += `${val.substring(2, 7)}-${val.substring(7, 11)}`;
                          } else {
                            formatted += val.substring(2);
                          }
                        }

                        setOrder(prev => {
                          const updated = { ...prev, customerInfo: { ...prev.customerInfo, phone: formatted } };

                          if (val.length >= 10) {
                            const savedDataStr = localStorage.getItem('pizza_customer_' + val);
                            if (savedDataStr) {
                              try {
                                const savedData = JSON.parse(savedDataStr);
                                if (!updated.customerInfo.name) updated.customerInfo.name = savedData.name || '';
                                if (!updated.customerInfo.rua) updated.customerInfo.rua = savedData.rua || '';
                                if (!updated.customerInfo.numero) updated.customerInfo.numero = savedData.numero || '';
                                if (!updated.customerInfo.bairro) updated.customerInfo.bairro = savedData.bairro || '';
                                if (!updated.customerInfo.reference) updated.customerInfo.reference = savedData.reference || '';
                              } catch (e) { }
                            }
                          }
                          return updated;
                        });

                        if (val.length >= 10) {
                          try {
                            const { data } = await supabase.from('customers').select('*').eq('phone', val).single();
                            if (data) {
                              setOrder(prev => {
                                const updated = { ...prev };
                                const info = updated.customerInfo;
                                if (!info.name && data.name) info.name = data.name;
                                if (!info.rua && data.rua) info.rua = data.rua;
                                if (!info.numero && data.numero) info.numero = data.numero;
                                if (!info.bairro && data.bairro) info.bairro = data.bairro;
                                if (!info.reference && data.reference) info.reference = data.reference;
                                return updated;
                              });
                            }
                          } catch (err) { }
                        }
                      }}
                      className={`w-full bg-white border rounded-2xl px-6 py-4 outline-none font-medium transition-all text-stone-800 shadow-sm ${triedToAdvance && order.customerInfo.phone.replace(/\D/g, '').length < 10 ? 'border-red-400 ring-4 ring-red-50' : 'border-stone-300 focus:ring-4 focus:ring-rose-500/10'}`}
                      placeholder="(DD) 90000-0000"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between mb-2">
                      <label className={`text-[10px] font-bold uppercase tracking-widest block ${triedToAdvance && !order.customerInfo.name.trim() ? 'text-red-500' : 'text-stone-600'}`}>Seu Nome *</label>
                      {triedToAdvance && !order.customerInfo.name.trim() && <span className="text-[9px] text-red-500 font-bold uppercase animate-pulse">Campo obrigatório</span>}
                    </div>
                    <input
                      type="text"
                      value={order.customerInfo.name}
                      onChange={e => setOrder({ ...order, customerInfo: { ...order.customerInfo, name: e.target.value } })}
                      className={`w-full bg-white border rounded-2xl px-6 py-4 outline-none font-medium transition-all text-stone-800 shadow-sm ${triedToAdvance && !order.customerInfo.name.trim() ? 'border-red-400 ring-4 ring-red-50' : 'border-stone-300 focus:ring-4 focus:ring-rose-500/10'}`}
                      placeholder="Como devemos te chamar?"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <button onClick={() => setOrder({ ...order, customerInfo: { ...order.customerInfo, orderType: 'retirada' } })} className={`relative py-4 rounded-2xl border-2 font-bold text-xs flex flex-col items-center justify-center gap-2 transition-all ${order.customerInfo.orderType === 'retirada' ? 'border-stone-800 bg-stone-800 text-white shadow-xl shadow-stone-200' : 'border-stone-300 bg-white text-stone-700 hover:border-stone-500 shadow-sm'}`}>
                    <div className="flex items-center gap-2">
                      <ShoppingBag size={18} /> Vou Retirar
                    </div>
                    {(() => {
                      if (!storeSettings.pickupDiscountActive) return null;

                      let potentialDiscount = 0;
                      order.pizzas.forEach(p => {
                        if (p.size && p.size !== 'P') potentialDiscount += storeSettings.pickupDiscountValue || 5;
                      });
                      if (potentialDiscount > 0) {
                        return (
                          <span className="bg-green-100 text-green-700 border border-green-200 px-2 py-0.5 rounded-full text-[10px] animate-pulse">
                            Economize R$ {potentialDiscount.toFixed(2).replace('.', ',')}
                          </span>
                        );
                      }
                      return null;
                    })()}
                  </button>
                  <button onClick={() => setOrder({ ...order, customerInfo: { ...order.customerInfo, orderType: 'entrega' } })} className={`py-4 rounded-2xl border-2 font-bold text-xs flex items-center justify-center gap-2 transition-all ${order.customerInfo.orderType === 'entrega' ? 'border-rose-600 bg-rose-600 text-white shadow-xl shadow-rose-200' : 'border-stone-300 bg-white text-stone-700 hover:border-stone-500 shadow-sm'}`}>
                    <MapPin size={18} /> Entrega (+ Taxa)
                  </button>
                </div>

                {order.customerInfo.orderType === 'entrega' && (
                  <div className="animate-in slide-in-from-top-2 space-y-4">
                    <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100 flex items-start gap-3">
                      <Info className="text-amber-600 shrink-0 mt-0.5" size={18} />
                      <p className="text-[11px] font-semibold text-amber-900 leading-relaxed">
                        Checar disponibilidade para entregas no <span className="font-bold">Santa Quitéria</span> e <span className="font-bold">Nova Esmeraldas</span>.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <div className="flex justify-between mb-2">
                          <label className={`text-[10px] font-bold uppercase tracking-widest block ${triedToAdvance && !order.customerInfo.rua.trim() ? 'text-red-500' : 'text-stone-600'}`}>Rua *</label>
                          {triedToAdvance && !order.customerInfo.rua.trim() && <span className="text-[9px] text-red-500 font-bold uppercase animate-pulse">Obrigatório</span>}
                        </div>
                        <input
                          type="text"
                          value={order.customerInfo.rua}
                          onChange={e => setOrder({ ...order, customerInfo: { ...order.customerInfo, rua: e.target.value } })}
                          className={`w-full bg-white border rounded-2xl px-6 py-4 outline-none font-medium transition-all text-stone-800 shadow-sm ${triedToAdvance && !order.customerInfo.rua.trim() ? 'border-red-400 ring-4 ring-red-50' : 'border-stone-300 focus:ring-4 focus:ring-rose-500/10'}`}
                          placeholder="Ex: Rua das Flores"
                        />
                      </div>

                      <div className="grid grid-cols-3 gap-4">
                        <div className="col-span-1">
                          <div className="flex justify-between mb-2">
                            <label className={`text-[10px] font-bold uppercase tracking-widest block ${triedToAdvance && !order.customerInfo.numero.trim() ? 'text-red-500' : 'text-stone-600'}`}>Nº *</label>
                            {triedToAdvance && !order.customerInfo.numero.trim() && <span className="text-[9px] text-red-500 font-bold uppercase animate-pulse">Obrigatório</span>}
                          </div>
                          <input
                            type="text"
                            value={order.customerInfo.numero}
                            onChange={e => setOrder({ ...order, customerInfo: { ...order.customerInfo, numero: e.target.value } })}
                            className={`w-full bg-white border rounded-2xl px-4 py-4 outline-none font-medium transition-all text-stone-800 shadow-sm ${triedToAdvance && !order.customerInfo.numero.trim() ? 'border-red-400 ring-4 ring-red-50' : 'border-stone-300 focus:ring-4 focus:ring-rose-500/10'}`}
                            placeholder="Ex: 123"
                          />
                        </div>
                        <div className="col-span-2">
                          <div className="flex justify-between mb-2">
                            <label className={`text-[10px] font-bold uppercase tracking-widest block ${triedToAdvance && !order.customerInfo.bairro.trim() ? 'text-red-500' : 'text-stone-600'}`}>Bairro *</label>
                            {triedToAdvance && !order.customerInfo.bairro.trim() && <span className="text-[9px] text-red-500 font-bold uppercase animate-pulse">Obrigatório</span>}
                          </div>
                          <select
                            value={order.customerInfo.bairro}
                            onChange={e => {
                              const selectedBairro = e.target.value;
                              setOrder({ ...order, customerInfo: { ...order.customerInfo, bairro: selectedBairro } });
                            }}
                            className={`w-full bg-white border rounded-2xl px-6 py-4 outline-none font-medium transition-all text-stone-800 shadow-sm appearance-none ${triedToAdvance && !order.customerInfo.bairro.trim() ? 'border-red-400 ring-4 ring-red-50' : 'border-stone-300 focus:ring-4 focus:ring-rose-500/10'}`}
                          >
                            <option value="">Selecione o Bairro...</option>
                            {storeSettings.deliveryNeighborhoods.map((nb: any) => (
                              <option key={nb.name} value={nb.name}>
                                {nb.name} {nb.fee > 0 ? `(+R$ ${Number(nb.fee).toFixed(2).replace('.', ',')})` : '(Grátis)'}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="text-[10px] font-bold uppercase tracking-widest text-stone-600 block mb-2">Referência (Opcional)</label>
                        <input
                          type="text"
                          value={order.customerInfo.reference}
                          onChange={e => setOrder({ ...order, customerInfo: { ...order.customerInfo, reference: e.target.value } })}
                          className="w-full bg-white border border-stone-300 focus:ring-4 focus:ring-rose-500/10 rounded-2xl px-6 py-4 outline-none font-medium transition-all text-stone-800 shadow-sm"
                          placeholder="Próximo ao mercado..."
                        />
                      </div>
                    </div>
                  </div>
                )}


                <textarea
                  value={order.customerInfo.observations}
                  onChange={e => setOrder({ ...order, customerInfo: { ...order.customerInfo, observations: e.target.value } })}
                  placeholder="Alguma observação adicional? (Ex: Retirar cebola, ponto da massa...)"
                  className="w-full bg-white border border-stone-300 rounded-2xl px-6 py-4 outline-none font-medium min-h-[120px] resize-none text-stone-800 shadow-sm focus:ring-4 focus:ring-rose-500/10"
                ></textarea>
              </div>
            </div>
          )}

          {/* PASSO 4: RESUMO */}
          {step === 4 && (
            <div className="animate-in fade-in zoom-in duration-500 max-w-2xl mx-auto">
              <div className="text-center mb-10">
                <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ReceiptText size={32} />
                </div>
                <h2 className="text-3xl font-serif font-bold text-stone-800">Resumo do Pedido</h2>
              </div>

              <div className="bg-stone-50 rounded-[2.5rem] p-8 border border-stone-200 space-y-6 shadow-inner">
                <div className="flex justify-between items-center border-b border-stone-200 pb-4">
                  <span className="text-stone-600 font-bold uppercase text-[10px] tracking-widest">ÍTENS</span>
                  <span className="text-rose-600 font-bold text-xs uppercase tracking-widest">Preço</span>
                </div>

                <div className="space-y-4">
                  {order.pizzas.map((p, i) => (
                    <div key={i} className="flex justify-between gap-4 border-b border-stone-100 pb-2">
                      <div className="flex-1">
                        <p className="font-bold text-stone-800 text-sm">Pizza {i + 1} ({p.size})</p>
                        <p className="text-[10px] text-stone-600 font-bold uppercase tracking-wide">
                          {p.type === 'whole' ? p.whole?.name : `${p.half1?.name} / ${p.half2?.name}`}
                          {p.bordaType === 'recheada' && ' • Borda Recheada'}
                        </p>
                      </div>
                      <span className="font-bold text-stone-800 text-sm">R$ {(p.sizePrice + p.bordaPrice).toFixed(2)}</span>
                    </div>
                  ))}

                  {order.refrigerantes.map((r, i) => (
                    <div key={i} className="flex justify-between text-xs font-bold text-stone-600">
                      <span>{r.name}</span>
                      <span>R$ {r.price.toFixed(2)}</span>
                    </div>
                  ))}

                  {order.customerInfo.orderType === 'entrega' && (
                    <div className="flex justify-between text-xs font-bold text-rose-600 italic">
                      <span>Taxa de Entrega</span>
                      <span>R$ {deliveryFee.toFixed(2)}</span>
                    </div>
                  )}

                  {withdrawalDiscount > 0 && (
                    <div className="flex justify-between text-xs font-bold text-green-600 italic">
                      <span>Desconto Retirada</span>
                      <span>- R$ {withdrawalDiscount.toFixed(2)}</span>
                    </div>
                  )}
                  {order.coupon && (
                    <div className="flex justify-between text-xs font-bold text-rose-500 italic">
                      <span>Cupom ({order.coupon.code})</span>
                      <span>- R$ {order.coupon.amount.toFixed(2)}</span>
                    </div>
                  )}
                </div>

                <div className="pt-6 border-t-2 border-dashed border-stone-300">
                  <div className="mb-4">
                    {!order.coupon ? (
                      <div>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={couponCodeInput}
                            onChange={e => { setCouponCodeInput(e.target.value.toUpperCase()); setCouponError(''); setCouponSuccess(''); }}
                            placeholder="Tem um cupom?"
                            className="flex-1 bg-white border border-stone-300 rounded-xl px-4 py-2 outline-none font-medium transition-all text-stone-800 shadow-sm focus:ring-2 focus:ring-rose-500/20 uppercase"
                          />
                          <button
                            onClick={async () => {
                              if (!couponCodeInput.trim()) return;
                              setCouponError('');
                              setCouponSuccess('');
                              try {
                                const { data, error } = await supabase.from('coupons').select('*').eq('code', couponCodeInput).single();
                                if (error || !data) {
                                  setCouponError('Cupom inválido ou inexistente.');
                                  return;
                                }
                                if (!data.is_active) {
                                  setCouponError('Este cupom está desativado.');
                                  return;
                                }
                                if (data.used_count >= data.max_uses) {
                                  setCouponError('Este cupom já esgotou.');
                                  return;
                                }
                                setOrder(prev => ({ ...prev, coupon: { code: data.code, amount: parseFloat(data.discount_amount) } }));
                                setCouponSuccess(`Oba! Desconto de R$ ${parseFloat(data.discount_amount).toFixed(2)} aplicado.`);
                                setCouponCodeInput('');
                              } catch (err) {
                                setCouponError('Erro ao validar.');
                              }
                            }}
                            className="bg-stone-800 text-white font-bold px-4 rounded-xl hover:bg-stone-700 transition-colors text-sm"
                          >
                            Aplicar
                          </button>
                        </div>
                        {couponError && <p className="text-[10px] text-red-500 font-bold mt-1 text-left">{couponError}</p>}
                        {couponSuccess && <p className="text-[10px] text-green-600 font-bold mt-1 text-left">{couponSuccess}</p>}
                      </div>
                    ) : (
                      <div className="flex items-center justify-between bg-rose-50 border border-rose-100 p-3 rounded-xl">
                        <div className="flex items-center gap-2">
                          <TicketPercent size={16} className="text-rose-500" />
                          <span className="text-sm font-bold text-rose-700">{order.coupon.code} aplicado!</span>
                        </div>
                        <button
                          onClick={() => setOrder(prev => ({ ...prev, coupon: null }))}
                          className="text-stone-400 hover:text-red-500 transition-colors"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-xl font-bold text-stone-800">Total a Pagar</span>
                    <span className="text-3xl font-serif font-bold text-rose-600">R$ {order.total.toFixed(2).replace('.', ',')}</span>
                  </div>
                </div>
              </div>

              <div className="mt-8 space-y-6">
                <div className="text-center mb-6">
                  <h3 className="text-xl font-serif font-bold text-stone-800">Forma de Pagamento</h3>
                  <p className="text-stone-600 text-sm">Como prefere pagar?</p>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {['cartao', 'pix', 'dinheiro'].map(m => (
                    <button key={m} onClick={() => setOrder({ ...order, customerInfo: { ...order.customerInfo, paymentMethod: m as any } })} className={`py-3 rounded-xl border-2 font-bold capitalize text-xs transition-all ${order.customerInfo.paymentMethod === m ? 'border-stone-800 bg-stone-800 text-white shadow-md' : 'border-stone-300 bg-white text-stone-700 hover:border-stone-500 shadow-sm'}`}>
                      {m}
                    </button>
                  ))}
                </div>

                {order.customerInfo.paymentMethod === 'pix' && (
                  <div className="animate-in slide-in-from-top-2 bg-stone-100 p-4 rounded-2xl border border-stone-200 mt-2">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-stone-500 mb-2">Chave Pix</p>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 bg-white px-4 py-3 rounded-xl border border-stone-200 font-mono text-sm font-bold text-stone-700 tracking-wider">
                        10383767695
                      </code>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText('10383767695');
                          setPixCopied(true);
                          setTimeout(() => setPixCopied(false), 2000);
                        }}
                        className={`px-4 py-3 rounded-xl font-bold text-xs transition-all flex items-center gap-2 ${pixCopied ? 'bg-green-500 text-white' : 'bg-stone-800 text-white hover:bg-stone-700'}`}
                      >
                        {pixCopied ? (
                          <>
                            <CheckCircle2 size={16} /> Copiado!
                          </>
                        ) : (
                          <>
                            <ReceiptText size={16} /> Copiar
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}

                {order.customerInfo.paymentMethod === 'dinheiro' && (
                  <div className="animate-in slide-in-from-top-2">
                    <div className="flex justify-between mb-2">
                      <label className={`text-[10px] font-bold uppercase tracking-widest block ${triedToAdvance && !order.customerInfo.changeFor.trim() ? 'text-red-500' : 'text-stone-600'}`}>Troco para quanto? *</label>
                      {triedToAdvance && !order.customerInfo.changeFor.trim() && <span className="text-[9px] text-red-500 font-bold uppercase animate-pulse">Campo obrigatório</span>}
                    </div>
                    <div className="relative">
                      <span className="absolute left-6 top-4 text-stone-400 font-medium tracking-wide">R$</span>
                      <input
                        type="text"
                        value={order.customerInfo.changeFor}
                        onChange={e => {
                          const valStr = e.target.value.replace(/\D/g, '');
                          if (valStr) {
                            const formatted = (parseFloat(valStr) / 100).toFixed(2);
                            setOrder({ ...order, customerInfo: { ...order.customerInfo, changeFor: formatted } });
                          } else {
                            setOrder({ ...order, customerInfo: { ...order.customerInfo, changeFor: '' } });
                          }
                        }}
                        className={`w-full bg-white border rounded-2xl pl-12 pr-6 py-4 outline-none font-medium transition-all text-stone-800 shadow-sm ${triedToAdvance && !order.customerInfo.changeFor.trim() ? 'border-red-400 ring-4 ring-red-50' : 'border-stone-300 focus:ring-4 focus:ring-rose-500/10'}`}
                        placeholder="0.00 (Deixe em branco p/ sem troco)"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* NAVEGAÇÃO ENTRE PASSOS */}
          <div className="mt-12 flex flex-col sm:flex-row gap-3 pt-8 border-t border-stone-200">
            {step > 1 && (
              <button onClick={handleBackStep} className="flex-1 py-5 rounded-2xl bg-stone-200 text-stone-700 font-bold hover:bg-stone-300 transition-all flex items-center justify-center gap-2 shadow-sm">
                <ChevronLeft size={20} /> Voltar
              </button>
            )}
            {step < 4 ? (
              <button onClick={handleNextStep} className="flex-[2] py-5 rounded-2xl bg-rose-600 text-white font-bold hover:bg-rose-700 transition-all flex items-center justify-center gap-2 shadow-xl shadow-rose-200 group">
                Próximo Passo <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </button>
            ) : (
              <button onClick={() => {
                if (order.customerInfo.paymentMethod === 'dinheiro' && !order.customerInfo.changeFor.trim()) {
                  setTriedToAdvance(true);
                  return;
                }
                setWhatsappModalOpen(true);
              }} className="flex-[2] py-5 rounded-2xl bg-green-600 text-white font-bold hover:bg-green-700 transition-all flex items-center justify-center gap-2 shadow-xl shadow-green-200">
                <Phone size={20} /> Finalizar no WhatsApp
              </button>
            )}
          </div>
        </div>
      </main>



      {/* MODAL WHATSAPP */}
      {whatsappModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-stone-900/80 backdrop-blur-md animate-in fade-in duration-300 no-print">
          <div className="bg-white rounded-[2.5rem] w-full max-w-md p-10 text-center shadow-2xl border-2 border-stone-100">
            <div className="mb-6 inline-flex p-5 bg-green-50 text-green-600 rounded-full animate-bounce">
              <Phone size={48} />
            </div>
            <h3 className="text-2xl font-serif font-bold text-stone-800 mb-2">Quase Pronto!</h3>
            <p className="text-stone-600 text-sm mb-10 leading-relaxed font-semibold">Seu pedido foi formatado com sucesso. Clique abaixo para enviar agora no nosso WhatsApp.</p>
            <div className="space-y-3">
              <a
                href={generateWhatsAppMessage()}
                target="_blank"
                className="w-full flex items-center justify-center gap-3 py-5 px-6 bg-green-600 text-white rounded-2xl font-bold hover:bg-green-700 transition-all shadow-xl shadow-green-100"
                onClick={() => {
                  saveOrderLocally();
                  setWhatsappModalOpen(false);
                  setIsFinished(true);
                }}
              >
                Abrir WhatsApp
              </a>
              <button onClick={() => setWhatsappModalOpen(false)} className="w-full py-4 text-stone-500 font-bold hover:text-stone-700 transition-colors text-[10px] uppercase tracking-widest border-t border-stone-100 mt-2">Voltar e Revisar</button>
            </div>
          </div>
        </div>
      )}

      <footer className="py-12 text-center text-stone-400 text-[10px] font-bold uppercase tracking-[0.4em] no-print">
        <p className="mb-4">&copy; Pizzaria Chalé &bull; Pedido Online</p>
        <button
          onClick={() => {
            if (adminUser) {
              setViewMode('admin-dashboard');
            } else {
              setViewMode('admin-login');
            }
          }}
          className="bg-stone-100 px-4 py-2 rounded-full border border-stone-200 text-stone-400 hover:text-stone-600 transition-colors flex items-center gap-2 mx-auto"
        >
          <Settings size={12} /> Painel Administrativo
        </button>
      </footer>
    </div>
  );
}
