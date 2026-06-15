import React, { useEffect, useState } from "react";
import { collection, query, where, orderBy, onSnapshot, doc, deleteDoc, updateDoc } from "firebase/firestore";
import { db, auth, handleFirestoreError, OperationType } from "../firebase";
import { ShoppingBag, ChevronDown, ChevronUp, Clock, MapPin, CheckCircle, Package, Truck, ArrowRight } from "lucide-react";

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
}

interface Order {
  id: string;
  userId: string;
  customerName: string;
  email: string;
  phone: string;
  totalPrice: number;
  items: OrderItem[];
  address: string;
  status: string;
  timestamp: number;
  type: string;
}

interface OrderHistoryProps {
  onReorderClick?: (items: OrderItem[]) => void;
  onTrackClick?: (order: Order) => void;
}

export default function OrderHistory({ onReorderClick, onTrackClick }: OrderHistoryProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    const orderCollectionPath = "orders";
    const q = query(
      collection(db, orderCollectionPath),
      where("userId", "==", user.uid),
      orderBy("timestamp", "desc")
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const fetchedOrders: Order[] = [];
        snapshot.forEach((snapshotDoc) => {
          const data = snapshotDoc.data();
          if (!data.isArchived && !data.archived) {
            fetchedOrders.push({ id: snapshotDoc.id, ...data } as Order);
          }
        });
        setOrders(fetchedOrders);
        setLoading(false);
      },
      (err) => {
        console.error("Failed to load real-time order history from Firestore:", err);
        setError("Could not load your order history. Please ensure safe connection.");
        setLoading(false);
        try {
          handleFirestoreError(err, OperationType.LIST, orderCollectionPath);
        } catch (wrappedErr) {
          // caught and logged by handleFirestoreError
        }
      }
    );

    return () => unsubscribe();
  }, []);

  const handleDeleteOrder = async (orderId: string) => {
    if (!window.confirm("Are you absolutely sure you want to delete this order? This action is permanent and cannot be undone.")) {
      return;
    }
    try {
      await deleteDoc(doc(db, "orders", orderId));
      alert("Order deleted successfully!");
    } catch (err: any) {
      console.error("Failed to delete order:", err);
      alert(`Could not delete order: ${err.message}`);
    }
  };

  const handleArchiveOrder = async (orderId: string) => {
    try {
      await updateDoc(doc(db, "orders", orderId), { isArchived: true });
      alert("Order archived successfully!");
    } catch (err: any) {
      console.error("Failed to archive order:", err);
      alert(`Could not archive order: ${err.message}`);
    }
  };

  const toggleExpandOrder = (id: string) => {
    setExpandedOrderId(prev => (prev === id ? null : id));
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Prepping":
        return <Package className="w-4 h-4 text-amber-500 animate-pulse" />;
      case "In Oven":
        return <Clock className="w-4 h-4 text-amber-500 animate-pulse" />;
      case "Out for Delivery":
        return <Truck className="w-4 h-4 text-amber-500 animate-pulse" />;
      case "Delivered":
        return <CheckCircle className="w-4 h-4 text-emerald-500" />;
      default:
        return <ShoppingBag className="w-4 h-4 text-neutral-400" />;
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "Prepping":
        return "bg-amber-950/20 text-amber-400 border border-amber-500/20";
      case "In Oven":
        return "bg-amber-950/25 text-amber-300 border border-amber-500/20";
      case "Out for Delivery":
        return "bg-amber-950/30 text-amber-400 border border-amber-500/30";
      case "Delivered":
        return "bg-emerald-950/20 text-emerald-400 border border-emerald-500/25";
      default:
        return "bg-neutral-900 text-neutral-400 border border-neutral-800";
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-3" id="order-history-loader">
        <span className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-[10px] font-mono uppercase tracking-widest text-neutral-400">Loading fine dining records...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-950/30 border border-red-900/40 text-red-300 text-xs font-mono rounded-none" id="order-history-error">
        ⚠️ {error}
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="text-center py-12 space-y-4" id="order-history-empty-state">
        <div className="w-12 h-12 bg-neutral-900 border border-neutral-800 flex items-center justify-center mx-auto">
          <ShoppingBag className="w-5 h-5 text-neutral-600" />
        </div>
        <div className="space-y-1">
          <p className="text-[11px] font-mono tracking-wider text-neutral-400 uppercase">NO CULINARY JOURNEYS YET</p>
          <p className="text-[10px] text-neutral-600 font-sans max-w-[240px] mx-auto leading-relaxed">
            Your premium orders placed while logged in will appear here in real time.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3" id="order-history-list">
      <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
        <span className="text-[10px] font-mono tracking-widest text-amber-500 uppercase font-bold">
          📜 order histories ({orders.length})
        </span>
        <span className="text-[8px] font-mono text-neutral-500 uppercase">
          Secured on Firestore
        </span>
      </div>

      <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1" id="order-history-scroll-panel">
        {orders.map((order) => {
          const isExpanded = expandedOrderId === order.id;
          const formattedDate = new Date(order.timestamp).toLocaleDateString("en-NG", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit"
          });

          return (
            <div 
              key={order.id} 
              className="bg-[#181818] border border-neutral-800/80 hover:border-amber-900/20 transition-all font-mono"
              id={`order-block-${order.id}`}
            >
              {/* Collapsed Header Bar */}
              <div 
                onClick={() => toggleExpandOrder(order.id)}
                className="p-3.5 flex items-center justify-between cursor-pointer select-none text-left"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-white tracking-widest">
                      #{order.id.slice(-6).toUpperCase()}
                    </span>
                    <span className="text-[9px] text-neutral-500">
                      {formattedDate}
                    </span>
                  </div>
                  <div className="text-[10px] text-neutral-400 tracking-tight font-sans">
                    {order.items.length} {order.items.length === 1 ? "dish" : "dishes"} • <span className="text-amber-500 font-mono font-bold">₦{order.totalPrice.toLocaleString()}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 text-[8px] uppercase tracking-wider font-bold ${getStatusBadgeClass(order.status)}`}>
                    {order.status}
                  </span>
                  {isExpanded ? (
                    <ChevronUp className="w-3.5 h-3.5 text-neutral-500" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5 text-neutral-500" />
                  )}
                </div>
              </div>

              {/* Expanded Detail Panel */}
              {isExpanded && (
                <div className="p-3.5 border-t border-neutral-800 bg-[#121212] space-y-3.5 text-left animate-slideDown">
                  {/* Dish List Grid */}
                  <div className="space-y-1.5" id={`order-expansion-${order.id}-dishes`}>
                    <p className="text-[9px] text-neutral-500 uppercase tracking-widest font-bold">Dish Selection</p>
                    <div className="space-y-1 text-[11px] text-neutral-300">
                      {(() => {
                        const items = order.items;
                        let itemsArray: any[] = [];
                        if (items) {
                          if (Array.isArray(items)) {
                            itemsArray = items;
                          } else if (typeof items === "string") {
                            try {
                              const parsed = JSON.parse(items);
                              if (Array.isArray(parsed)) {
                                itemsArray = parsed;
                              } else if (parsed && typeof parsed === "object") {
                                itemsArray = Object.values(parsed);
                              }
                            } catch (_) {}
                          } else if (typeof items === "object") {
                            itemsArray = Object.values(items);
                          }
                        }
                        return itemsArray.map((item: any, idx: number) => (
                          <div key={idx} className="flex justify-between items-center bg-[#181818] px-2 py-1.5">
                            <span>
                              {(item?.quantity || 1)}x <span className="text-white font-sans">{item?.name || "Gourmet Dish"}</span>
                            </span>
                            <span className="text-[10px] text-amber-500">
                              ₦{((item?.price || 5000) * (item?.quantity || 1)).toLocaleString()}
                            </span>
                          </div>
                        ));
                      })()}
                    </div>
                  </div>

                  {/* Delivery Sanctuary Details */}
                  <div className="space-y-1">
                    <p className="text-[9px] text-neutral-500 uppercase tracking-widest font-bold">Fulfillment Details</p>
                    <div className="bg-[#181818] p-2 text-[10px] space-y-1 text-neutral-400">
                      <div className="flex items-start gap-1 font-sans">
                        <MapPin className="w-3.5 h-3.5 text-neutral-500 shrink-0 mt-0.5" />
                        <span>Address: {order.address}</span>
                      </div>
                      <div className="font-sans">
                        Type: <span className="text-amber-500 font-mono uppercase tracking-wider font-bold text-[9px]">{order.type}</span>
                      </div>
                    </div>
                  </div>

                  {/* Custom Action Utilities */}
                  <div className="flex gap-2 pt-1">
                    {onTrackClick && (
                      <button
                        onClick={() => onTrackClick(order)}
                        className="flex-1 py-1.5 bg-amber-500 text-black text-[9px] tracking-widest font-extrabold uppercase hover:bg-amber-400 transition-colors flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <Truck className="w-3.5 h-3.5" />
                        <span>Track Order Progress</span>
                      </button>
                    )}
                    {onReorderClick && (
                      <button
                        onClick={() => onReorderClick(order.items)}
                        className="flex-1 py-1.5 bg-[#202020] hover:bg-neutral-800 border border-neutral-800 text-neutral-200 text-[9px] tracking-widest font-semibold uppercase transition-all flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <ShoppingBag className="w-3.5 h-3.5" />
                        <span>Reorder Basket</span>
                      </button>
                    )}
                  </div>

                  {order.status === "Delivered" && (
                    <div className="flex gap-2 mt-2 pt-2 border-t border-neutral-850/65">
                      <button
                        onClick={() => handleDeleteOrder(order.id)}
                        className="flex-1 py-1.5 bg-red-950/40 hover:bg-red-900/40 border border-red-900/30 text-red-500 text-[9px] tracking-widest font-bold uppercase transition-all flex items-center justify-center gap-1 cursor-pointer"
                      >
                        Delete Order
                      </button>
                      <button
                        onClick={() => handleArchiveOrder(order.id)}
                        className="flex-1 py-1.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 text-[9px] tracking-widest font-bold uppercase transition-all flex items-center justify-center gap-1 cursor-pointer"
                      >
                        Archive Order
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
