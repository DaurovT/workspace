import { io } from 'socket.io-client';
import { useStore } from './store';
import { useFinanceStore } from './modules/finance/financeStore';
import { useServiceStore } from './modules/service/serviceStore';

const socket = io(import.meta.env.PROD ? '/' : 'http://localhost:3001');

socket.on('db_mutation', (data: { model: string, action: string, userId: string, resultId: string, data?: any }) => {
  const currentUserId = useStore.getState().currentUserId;

  if (data.userId === currentUserId && data.userId !== 'system') {
    return;
  }

  const financeModels = [
    'Transaction', 'Account', 'Category', 'Project', 'Contractor',
    'LegalEntity', 'Deal', 'Fund', 'Asset', 'Loan', 'Invoice', 'PaymentRequest'
  ];

  if (data.model.startsWith('Arcana')) {
    const payload = data.data;
    if (payload) {
      const st = useStore.getState();

      if (data.model === 'ArcanaTask') {
        const t = payload;
        const taskObj = {
          ...t,
          tags: t.tags ? (typeof t.tags === 'string' ? JSON.parse(t.tags) : t.tags) : [],
          dependencies: t.dependencies ? (typeof t.dependencies === 'string' ? JSON.parse(t.dependencies) : t.dependencies) : []
        };

        if (data.action === 'CREATE') {
          useStore.setState({ tasks: [...st.tasks.filter(x => x.id !== taskObj.id), taskObj] });
        } else if (data.action === 'UPDATE') {
          useStore.setState({ tasks: st.tasks.map(x => x.id === taskObj.id ? taskObj : x) });
        } else if (data.action === 'DELETE') {
          useStore.setState({ tasks: st.tasks.filter(x => x.id !== data.resultId) });
        }
      } else if (data.model === 'ArcanaComment') {
        if (data.action === 'CREATE') {
          useStore.setState({ comments: [...st.comments.filter(x => x.id !== payload.id), payload] });
        } else if (data.action === 'DELETE') {
          useStore.setState({ comments: st.comments.filter(x => x.id !== data.resultId) });
        }
      } else {
        st.loadArcanaData();
      }
    } else {
      useStore.getState().loadArcanaData();
    }
  } else if (financeModels.includes(data.model)) {
    const payload = data.data;
    if (payload) {
      const st = useFinanceStore.getState() as any;

      const modelMap: Record<string, string> = {
        'Transaction': 'transactions',
        'Account': 'accounts',
        'Category': 'categories',
        'Project': 'projects',
        'Contractor': 'contractors',
        'LegalEntity': 'entities',
        'Deal': 'deals',
        'Fund': 'funds',
        'Asset': 'assets',
        'Loan': 'loans',
        'Invoice': 'invoices',
        'PaymentRequest': 'paymentRequests'
      };

      const arrayName = modelMap[data.model];
      if (arrayName && st[arrayName]) {
        if (data.action === 'CREATE') {
          useFinanceStore.setState({ [arrayName]: [payload, ...st[arrayName].filter((x: any) => x.id !== payload.id)] } as any);
        } else if (data.action === 'UPDATE') {
          // For Transaction: treat isDeleted=true as a DELETE (soft delete)
          if (data.model === 'Transaction' && payload.isDeleted === true) {
            useFinanceStore.setState({ [arrayName]: st[arrayName].filter((x: any) => x.id !== payload.id) } as any);
          } else {
            useFinanceStore.setState({ [arrayName]: st[arrayName].map((x: any) => x.id === payload.id ? payload : x) } as any);
          }
        } else if (data.action === 'DELETE') {
          useFinanceStore.setState({ [arrayName]: st[arrayName].filter((x: any) => x.id !== data.resultId) } as any);
        }
      } else {
        useFinanceStore.getState().fetchInitialData();
      }
    } else {
      useFinanceStore.getState().fetchInitialData();
    }
  } else if (data.model === 'ServiceTicket') {
    const payload = data.data;
    if (payload) {
      const st = useServiceStore.getState() as any;
      if (data.action === 'CREATE') {
        useServiceStore.setState({ tickets: [payload, ...st.tickets.filter((x: any) => x.id !== payload.id)] } as any);
      } else if (data.action === 'UPDATE') {
        useServiceStore.setState({ tickets: st.tickets.map((x: any) => x.id === payload.id ? payload : x) } as any);
      } else if (data.action === 'DELETE') {
        useServiceStore.setState({ tickets: st.tickets.filter((x: any) => x.id !== data.resultId) } as any);
      }
    } else {
      useServiceStore.getState().fetchInitialData();
    }
  } else if (data.model === 'ServiceTicketComment') {
    const payload = data.data;
    if (payload) {
      const st = useServiceStore.getState() as any;
      const t = st.tickets.find((t: any) => t.id === payload.ticketId);
      if (t) {
        if (data.action === 'CREATE') {
          const comments = t.comments || [];
          useServiceStore.setState({
            tickets: st.tickets.map((x: any) => x.id === payload.ticketId ? { ...x, comments: [...comments.filter((c: any) => c.id !== payload.id), payload] } : x)
          } as any);
        } else if (data.action === 'DELETE') {
          const comments = t.comments || [];
          useServiceStore.setState({
            tickets: st.tickets.map((x: any) => x.id === payload.ticketId ? { ...x, comments: comments.filter((c: any) => c.id !== data.resultId) } : x)
          } as any);
        }
      } else {
        useServiceStore.getState().fetchInitialData();
      }
    }
  }
});

export default socket;
