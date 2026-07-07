import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
    SafeAreaView,
    Modal,
    ScrollView,
    Alert,
    Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from './api';

const showAlert = (title, message) => {
    if (Platform.OS === 'web') {
        alert(message ? `${title}\n\n${message}` : title);
    } else {
        Alert.alert(title, message);
    }
};

const getProductEmoji = (nombre) => {
    const n = nombre.toLowerCase();
    if (n.includes('heno') || n.includes('timothy') || n.includes('fibra')) return '🌾';
    if (n.includes('alimento') || n.includes('extruido') || n.includes('pellets') || n.includes('comida')) return '🍲';
    if (n.includes('calcio') || n.includes('suplemento') || n.includes('vitamina') || n.includes('gotas')) return '💊';
    if (n.includes('placa') || n.includes('termica') || n.includes('calor') || n.includes('calefactor')) return '🔥';
    if (n.includes('sustrato') || n.includes('coco') || n.includes('tierra')) return '🥥';
    if (n.includes('bebedero') || n.includes('comedero')) return '💧';
    return '📦';
};

const getStatusColor = (status) => {
    switch (status) {
        case 'pendiente': return { bg: '#fef3c7', text: '#b45309', label: 'Pendiente' };
        case 'preparando': return { bg: '#dbeafe', text: '#1e40af', label: 'Preparando' };
        case 'listo': return { bg: '#dcfce7', text: '#15803d', label: 'Listo para Retiro' };
        case 'retirado': return { bg: '#f1f5f9', text: '#475569', label: 'Retirado / Entregado' };
        case 'cancelado': return { bg: '#fee2e2', text: '#b91c1c', label: 'Cancelado' };
        default: return { bg: '#f1f5f9', text: '#475569', label: status };
    }
};

export default function TiendaScreen({ navigation }) {
    const [user, setUser] = useState(null);
    const [activeTab, setActiveTab] = useState('catalogo'); // 'catalogo' | 'pedidos'
    const [productos, setProductos] = useState([]);
    const [pedidos, setPedidos] = useState([]);
    const [loadingProducts, setLoadingProducts] = useState(true);
    const [loadingOrders, setLoadingOrders] = useState(false);
    const [checkoutLoading, setCheckoutLoading] = useState(false);
    
    // Shopping Cart State
    const [cart, setCart] = useState([]);
    const [cartModalVisible, setCartModalVisible] = useState(false);
    
    // Order Filter State
    const [orderFilter, setOrderFilter] = useState('todos');

    // Order Success Modal State
    const [successModalVisible, setSuccessModalVisible] = useState(false);
    const [latestOrderCode, setLatestOrderCode] = useState('');

    // Order Details Modal State
    const [detailsModalVisible, setDetailsModalVisible] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [orderDetails, setOrderDetails] = useState([]);
    const [loadingDetails, setLoadingDetails] = useState(false);

    const loadUser = async () => {
        try {
            const userData = await AsyncStorage.getItem('user');
            if (userData) {
                setUser(JSON.parse(userData));
            }
        } catch (err) {
            console.error('Error al obtener usuario:', err);
        }
    };

    const loadProducts = async () => {
        setLoadingProducts(true);
        try {
            const response = await api.get('/productos');
            if (response.data.success) {
                setProductos(response.data.data);
            }
        } catch (err) {
            console.error('Error al cargar productos:', err);
            showAlert('Error', 'No se pudo cargar el catálogo de productos.');
        } finally {
            setLoadingProducts(false);
        }
    };

    const loadMyOrders = async () => {
        setLoadingOrders(true);
        try {
            const response = await api.get('/pedidos/mis-pedidos');
            if (response.data.success) {
                setPedidos(response.data.data);
            }
        } catch (err) {
            console.error('Error al cargar pedidos:', err);
            showAlert('Error', 'No se pudo cargar el historial de pedidos.');
        } finally {
            setLoadingOrders(false);
        }
    };

    useEffect(() => {
        loadUser();
        loadProducts();
    }, []);

    useEffect(() => {
        if (activeTab === 'pedidos') {
            loadMyOrders();
        } else {
            loadProducts();
        }
    }, [activeTab]);

    // Cart Helper Functions
    const addToCart = (product) => {
        const existing = cart.find(item => item.producto_id === product.id);
        if (existing) {
            if (existing.cantidad >= product.stock) {
                showAlert('Stock Máximo', `Solo hay ${product.stock} unidades de este producto.`);
                return;
            }
            setCart(cart.map(item => 
                item.producto_id === product.id 
                    ? { ...item, cantidad: item.cantidad + 1 }
                    : item
            ));
        } else {
            setCart([...cart, {
                producto_id: product.id,
                nombre: product.nombre,
                precio: parseFloat(product.precio),
                cantidad: 1,
                maxStock: product.stock,
                iva: product.iva !== null && product.iva !== undefined ? product.iva : 13
            }]);
        }
    };

    const decreaseQuantity = (productId) => {
        const existing = cart.find(item => item.producto_id === productId);
        if (existing.cantidad > 1) {
            setCart(cart.map(item => 
                item.producto_id === productId 
                    ? { ...item, cantidad: item.cantidad - 1 }
                    : item
            ));
        } else {
            removeFromCart(productId);
        }
    };

    const removeFromCart = (productId) => {
        setCart(cart.filter(item => item.producto_id !== productId));
    };

    const getCartSubtotal = () => {
        return cart.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);
    };

    const getCartIva = () => {
        return cart.reduce((sum, item) => {
            const itemIva = item.iva !== null && item.iva !== undefined ? item.iva : 13;
            return sum + (item.precio * item.cantidad * (itemIva / 100));
        }, 0);
    };

    const getCartTotal = () => {
        return getCartSubtotal() + getCartIva();
    };

    const handleCheckout = async () => {
        if (cart.length === 0) return;
        setCheckoutLoading(true);
        try {
            const checkoutBody = {
                items: cart.map(item => ({
                    producto_id: item.producto_id,
                    cantidad: item.cantidad,
                    precio_unitario: item.precio
                })),
                total: getCartTotal()
            };

            const response = await api.post('/pedidos', checkoutBody);
            if (response.data.success) {
                setLatestOrderCode(response.data.data.codigo_retiro);
                setCart([]);
                setCartModalVisible(false);
                setSuccessModalVisible(true);
            }
        } catch (err) {
            console.error('Error en checkout:', err);
            showAlert('Error al comprar', err.response?.data?.message || 'No se pudo procesar la compra.');
        } finally {
            setCheckoutLoading(false);
        }
    };

    const handleCancelOrder = async (orderId) => {
        const confirmMsg = '¿Estás seguro de que deseas cancelar este pedido? El stock de los productos se liberará.';
        if (Platform.OS === 'web') {
            if (!confirm(confirmMsg)) return;
        } else {
            Alert.alert('Confirmar Cancelación', confirmMsg, [
                { text: 'No', style: 'cancel' },
                { text: 'Sí, Cancelar', onPress: () => performCancel(orderId) }
            ]);
            return;
        }
        await performCancel(orderId);
    };

    const performCancel = async (orderId) => {
        try {
            const response = await api.put(`/pedidos/${orderId}/cancelar`);
            if (response.data.success) {
                showAlert('Pedido Cancelado', 'Tu pedido ha sido cancelado con éxito.');
                loadMyOrders();
                loadProducts();
            }
        } catch (err) {
            console.error(err);
            showAlert('Error', err.response?.data?.message || 'No se pudo cancelar el pedido.');
        }
    };

    const handleEditOrder = async (order) => {
        const confirmMsg = 'Para editar tu pedido, cancelaremos el pedido actual para liberar el stock y cargaremos sus productos de nuevo en tu carrito para que puedas modificarlos. ¿Deseas continuar?';
        if (Platform.OS === 'web') {
            if (!confirm(confirmMsg)) return;
        } else {
            Alert.alert('Editar Pedido', confirmMsg, [
                { text: 'Cancelar', style: 'cancel' },
                { text: 'Continuar', onPress: () => performEdit(order) }
            ]);
            return;
        }
        await performEdit(order);
    };

    const performEdit = async (order) => {
        try {
            // 1. Obtener detalles del pedido
            const response = await api.get(`/pedidos/${order.id}/detalle`);
            if (!response.data.success) throw new Error('No se pudo cargar el detalle del pedido.');
            const details = response.data.data;

            // 2. Cancelar el pedido antiguo en el servidor
            await api.put(`/pedidos/${order.id}/cancelar`);

            // 3. Cargar en el carrito
            const productsInCart = details.map(item => {
                const prodId = item.producto_id || item.productos_id;
                const dbProduct = productos.find(p => p.id === prodId);
                return {
                    producto_id: prodId,
                    nombre: item.producto_nombre,
                    precio: parseFloat(item.precio_unitario),
                    cantidad: item.cantidad,
                    maxStock: item.cantidad + (dbProduct?.stock || 0),
                    iva: dbProduct?.iva !== null && dbProduct?.iva !== undefined ? dbProduct.iva : 13
                };
            });

            setCart(productsInCart);
            setActiveTab('catalogo');
            setCartModalVisible(true);
            showAlert('Carrito Cargado', 'Los productos de tu pedido se cargaron en el carrito. Modifícalos y confirma para guardar los cambios.');
            
            loadMyOrders();
            loadProducts();
        } catch (err) {
            console.error(err);
            showAlert('Error', err.response?.data?.message || 'No se pudo editar el pedido.');
        }
    };

    const fetchOrderDetails = async (order) => {
        setSelectedOrder(order);
        setLoadingDetails(true);
        setDetailsModalVisible(true);
        try {
            const response = await api.get(`/pedidos/${order.id}/detalle`);
            if (response.data.success) {
                setOrderDetails(response.data.data);
            }
        } catch (err) {
            console.error('Error al cargar detalle:', err);
            showAlert('Error', 'No se pudieron cargar los detalles del pedido.');
        } finally {
            setLoadingDetails(false);
        }
    };

    const filteredPedidos = pedidos.filter(p => {
        if (orderFilter === 'todos') return true;
        return p.estado === orderFilter;
    });

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <TouchableOpacity onPress={() => navigation.replace('Dashboard')} style={styles.backButton}>
                        <Text style={styles.backButtonText}>‹ Volver</Text>
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>🛍️ Tienda y Pedidos</Text>
                </View>
            </View>

            {/* Navigation Tabs */}
            <View style={styles.tabContainer}>
                <TouchableOpacity
                    style={[styles.tabButton, activeTab === 'catalogo' && styles.tabButtonActive]}
                    onPress={() => setActiveTab('catalogo')}
                >
                    <Text style={[styles.tabButtonText, activeTab === 'catalogo' && styles.tabButtonTextActive]}>
                        🛍️ Catálogo
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tabButton, activeTab === 'pedidos' && styles.tabButtonActive]}
                    onPress={() => setActiveTab('pedidos')}
                >
                    <Text style={[styles.tabButtonText, activeTab === 'pedidos' && styles.tabButtonTextActive]}>
                        📋 Mis Pedidos
                    </Text>
                </TouchableOpacity>
            </View>

            {activeTab === 'catalogo' ? (
                <View style={{ flex: 1 }}>
                    <ScrollView contentContainerStyle={styles.listContent} persistentScrollbar={true}>
                        {loadingProducts ? (
                            <ActivityIndicator size="large" color="#2563eb" style={{ marginTop: 40 }} />
                        ) : productos.length === 0 ? (
                            <Text style={styles.noDataText}>No hay productos disponibles en este momento.</Text>
                        ) : (
                            productos.map(p => {
                                const cartItem = cart.find(item => item.producto_id === p.id);
                                return (
                                    <View key={p.id} style={styles.productCard}>
                                        <View style={styles.productHeader}>
                                            <Text style={styles.productEmoji}>{getProductEmoji(p.nombre)}</Text>
                                            <View style={{ flex: 1 }}>
                                                <Text style={styles.productName}>{p.nombre}</Text>
                                                <Text style={styles.productStock}>En stock: {p.stock} uds</Text>
                                            </View>
                                            <View style={{ alignItems: 'flex-end' }}>
                                                <Text style={styles.productPrice}>₡{parseFloat(p.precio).toLocaleString()}</Text>
                                                <Text style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>+ IVA: {p.iva !== null && p.iva !== undefined ? p.iva : 13}%</Text>
                                            </View>
                                        </View>
                                        <Text style={styles.productDesc}>{p.descripcion || 'Sin descripción disponible.'}</Text>
                                        
                                        <View style={styles.productActionRow}>
                                            {cartItem ? (
                                                <View style={styles.quantityStepper}>
                                                    <TouchableOpacity 
                                                        style={styles.stepperBtn} 
                                                        onPress={() => decreaseQuantity(p.id)}
                                                    >
                                                        <Text style={styles.stepperBtnText}>-</Text>
                                                    </TouchableOpacity>
                                                    <Text style={styles.stepperValue}>{cartItem.cantidad}</Text>
                                                    <TouchableOpacity 
                                                        style={styles.stepperBtn} 
                                                        onPress={() => addToCart(p)}
                                                    >
                                                        <Text style={styles.stepperBtnText}>+</Text>
                                                    </TouchableOpacity>
                                                </View>
                                            ) : (
                                                <TouchableOpacity 
                                                    style={[styles.buyBtn, p.stock <= 0 && styles.disabledBtn]} 
                                                    onPress={() => addToCart(p)}
                                                    disabled={p.stock <= 0}
                                                >
                                                    <Text style={styles.buyBtnText}>
                                                        {p.stock <= 0 ? 'Agotado' : '🛒 Agregar'}
                                                    </Text>
                                                </TouchableOpacity>
                                            )}
                                        </View>
                                    </View>
                                );
                            })
                        )}
                    </ScrollView>

                    {/* Floating Cart bar at bottom */}
                    {cart.length > 0 && (
                        <View style={styles.cartBar}>
                            <View>
                                <Text style={styles.cartBarCount}>{cart.reduce((sum, i) => sum + i.cantidad, 0)} productos</Text>
                                <Text style={styles.cartBarTotal}>Total: ₡{getCartTotal().toLocaleString()}</Text>
                            </View>
                            <TouchableOpacity style={styles.cartBarBtn} onPress={() => setCartModalVisible(true)}>
                                <Text style={styles.cartBarBtnText}>Ver Carrito 🛒</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            ) : (
                <View style={{ flex: 1 }}>
                    {/* Status Tabs Filter */}
                    <ScrollView 
                        horizontal={true} 
                        showsHorizontalScrollIndicator={false} 
                        style={styles.statusFiltersScroll}
                        contentContainerStyle={styles.statusFilters}
                    >
                        {['todos', 'pendiente', 'preparando', 'listo', 'retirado', 'cancelado'].map(f => (
                            <TouchableOpacity
                                key={f}
                                style={[styles.filterChip, orderFilter === f && styles.filterChipActive]}
                                onPress={() => setOrderFilter(f)}
                            >
                                <Text style={[styles.filterChipText, orderFilter === f && styles.filterChipTextActive]}>
                                    {f === 'todos' ? 'Todos' : getStatusColor(f).label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>

                    <ScrollView contentContainerStyle={[styles.listContent, { paddingTop: 0 }]} persistentScrollbar={true}>
                        {loadingOrders ? (
                            <ActivityIndicator size="large" color="#2563eb" style={{ marginTop: 40 }} />
                        ) : filteredPedidos.length === 0 ? (
                            <Text style={styles.noDataText}>No tienes pedidos registrados en este filtro.</Text>
                        ) : (
                            filteredPedidos.map(o => {
                            const statusInfo = getStatusColor(o.estado);
                            return (
                                <View key={o.id} style={styles.orderCard}>
                                    <View style={styles.orderHeader}>
                                        <View>
                                            <Text style={styles.orderCode}>Código: {o.codigo_retiro}</Text>
                                            <Text style={styles.orderDate}>Fecha: {new Date(o.fecha_pedido).toLocaleDateString()}</Text>
                                        </View>
                                        <View style={[styles.statusBadge, { backgroundColor: statusInfo.bg }]}>
                                            <Text style={[styles.statusText, { color: statusInfo.text }]}>
                                                {statusInfo.label}
                                            </Text>
                                        </View>
                                    </View>

                                    <View style={styles.orderFooter}>
                                        <Text style={styles.orderPrice}>Total: ₡{parseFloat(o.total).toLocaleString()}</Text>
                                        <TouchableOpacity style={styles.detailsBtn} onPress={() => fetchOrderDetails(o)}>
                                            <Text style={styles.detailsBtnText}>🔍 Detalle</Text>
                                        </TouchableOpacity>
                                    </View>

                                    {o.estado === 'pendiente' && (
                                        <View style={styles.orderPendingActions}>
                                            <TouchableOpacity 
                                                style={[styles.actionBtn, styles.editOrderBtn]} 
                                                onPress={() => handleEditOrder(o)}
                                            >
                                                <Text style={styles.editOrderBtnText}>✏️ Editar Pedido</Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity 
                                                style={[styles.actionBtn, styles.cancelOrderBtn]} 
                                                onPress={() => handleCancelOrder(o.id)}
                                            >
                                                <Text style={styles.cancelOrderBtnText}>❌ Cancelar</Text>
                                            </TouchableOpacity>
                                        </View>
                                    )}

                                    {/* Info/Warning alert for Pickup */}
                                    {o.estado === 'listo' && (
                                        <View style={[styles.alertBox, styles.successAlert]}>
                                            <Text style={styles.alertText}>
                                                ✅ ¡Tu pedido está listo! Ya puedes pasar a retirarlo a la clínica con tu código.
                                            </Text>
                                        </View>
                                    )}
                                    {o.estado === 'pendiente' && (
                                        <View style={[styles.alertBox, styles.pendingAlert]}>
                                            <Text style={styles.alertText}>
                                                ⏳ Pedido registrado. Lo prepararemos a la brevedad.
                                            </Text>
                                        </View>
                                    )}
                                    {o.estado === 'preparando' && (
                                        <View style={[styles.alertBox, styles.pendingAlert]}>
                                            <Text style={styles.alertText}>
                                                📦 Estamos preparando tus productos en el almacén.
                                            </Text>
                                        </View>
                                    )}
                                </View>
                            );
                        })
                    )}
                </ScrollView>
                </View>
            )}

            {/* Modal de Carrito de Compras */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={cartModalVisible}
                onRequestClose={() => setCartModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>🛒 Carrito de Compras</Text>

                        <ScrollView style={styles.modalCartList} persistentScrollbar={true}>
                            {cart.map(item => (
                                <View key={item.producto_id} style={styles.cartItemRow}>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.cartItemName}>{item.nombre}</Text>
                                        <Text style={styles.cartItemSub}>
                                            ₡{item.precio.toLocaleString()} x {item.cantidad}
                                        </Text>
                                    </View>
                                    <View style={styles.stepperInCart}>
                                        <TouchableOpacity 
                                            style={styles.stepperInCartBtn} 
                                            onPress={() => decreaseQuantity(item.producto_id)}
                                        >
                                            <Text style={styles.stepperInCartBtnText}>-</Text>
                                        </TouchableOpacity>
                                        <Text style={styles.stepperInCartValue}>{item.cantidad}</Text>
                                        <TouchableOpacity 
                                            style={styles.stepperInCartBtn} 
                                            onPress={() => {
                                                const prod = productos.find(p => p.id === item.producto_id);
                                                addToCart(prod);
                                            }}
                                        >
                                            <Text style={styles.stepperInCartBtnText}>+</Text>
                                        </TouchableOpacity>
                                    </View>
                                    <TouchableOpacity style={styles.removeCartBtn} onPress={() => removeFromCart(item.producto_id)}>
                                        <Text style={styles.removeCartBtnText}>🗑️</Text>
                                    </TouchableOpacity>
                                </View>
                            ))}
                        </ScrollView>

                        {/* Totals Summary */}
                        <View style={styles.summaryCard}>
                            <View style={styles.summaryRow}>
                                <Text style={styles.summaryLabel}>Subtotal:</Text>
                                <Text style={styles.summaryValue}>₡{getCartSubtotal().toLocaleString(undefined, { maximumFractionDigits: 2 })}</Text>
                            </View>
                            <View style={styles.summaryRow}>
                                <Text style={styles.summaryLabel}>IVA:</Text>
                                <Text style={styles.summaryValue}>₡{getCartIva().toLocaleString(undefined, { maximumFractionDigits: 2 })}</Text>
                            </View>
                            <View style={[styles.summaryRow, { borderTopWidth: 1, borderTopColor: '#e2e8f0', paddingTop: 8, marginTop: 8 }]}>
                                <Text style={[styles.summaryLabel, styles.boldText]}>Total:</Text>
                                <Text style={[styles.summaryValue, styles.boldText, { color: '#2563eb' }]}>
                                    ₡{getCartTotal().toLocaleString()}
                                </Text>
                            </View>
                        </View>

                        <View style={styles.modalActionButtons}>
                            <TouchableOpacity 
                                style={[styles.modalBtn, styles.cancelModalBtn]} 
                                onPress={() => setCartModalVisible(false)}
                            >
                                <Text style={styles.cancelModalBtnText}>Continuar Comprando</Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                                style={[styles.modalBtn, styles.saveModalBtn]} 
                                onPress={handleCheckout}
                                disabled={checkoutLoading}
                            >
                                {checkoutLoading ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <Text style={styles.saveModalBtnText}>Confirmar Pedido 🛍️</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            {/* Modal de Pedido Exitoso (Mensaje de Retiro) */}
            <Modal
                animationType="fade"
                transparent={true}
                visible={successModalVisible}
                onRequestClose={() => setSuccessModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { alignItems: 'center', padding: 25 }]}>
                        <Text style={styles.successIcon}>🎉</Text>
                        <Text style={styles.successTitle}>¡Pedido Registrado con Éxito!</Text>
                        
                        <Text style={styles.successDesc}>
                            Tu pedido ha sido procesado de forma correcta. Presenta el siguiente código al retirar en la clínica veterinaria:
                        </Text>

                        <View style={styles.codeContainer}>
                            <Text style={styles.codeText}>{latestOrderCode}</Text>
                        </View>

                        <Text style={styles.instructionText}>
                            📍 Retiro en: Clínica Veterinaria de Animales Exóticos.{"\n"}
                            🕒 Horario: Lunes a Viernes de 06:00 a 15:00.
                        </Text>

                        <TouchableOpacity 
                            style={styles.successCloseBtn} 
                            onPress={() => {
                                setSuccessModalVisible(false);
                                setActiveTab('pedidos');
                            }}
                        >
                            <Text style={styles.successCloseBtnText}>Entendido</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Modal de Detalle de Pedido (Ver Detalle) */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={detailsModalVisible}
                onRequestClose={() => setDetailsModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>📋 Pedido: {selectedOrder?.codigo_retiro}</Text>

                        {loadingDetails ? (
                            <ActivityIndicator size="large" color="#2563eb" style={{ marginVertical: 40 }} />
                        ) : (
                            <ScrollView style={styles.modalCartList} persistentScrollbar={true}>
                                {orderDetails.map(item => (
                                    <View key={item.id} style={styles.detailItemRow}>
                                        <Text style={styles.detailItemEmoji}>{getProductEmoji(item.producto_nombre || '')}</Text>
                                        <View style={{ flex: 1 }}>
                                            <Text style={styles.detailItemName}>{item.producto_nombre || 'Producto'}</Text>
                                            <Text style={styles.detailItemPrice}>
                                                ₡{parseFloat(item.precio_unitario).toLocaleString()} x {item.cantidad}
                                            </Text>
                                        </View>
                                        <Text style={styles.detailItemSubtotal}>
                                            Sub: ₡{(parseFloat(item.precio_unitario) * item.cantidad).toLocaleString()}
                                        </Text>
                                    </View>
                                ))}
                            </ScrollView>
                        )}

                        <View style={styles.summaryCard}>
                            <View style={styles.summaryRow}>
                                <Text style={styles.summaryLabel}>Subtotal:</Text>
                                <Text style={styles.summaryValue}>
                                    ₡{selectedOrder ? parseFloat(selectedOrder.subtotal).toLocaleString() : '0'}
                                </Text>
                            </View>
                            <View style={styles.summaryRow}>
                                <Text style={styles.summaryLabel}>IVA:</Text>
                                <Text style={styles.summaryValue}>
                                    ₡{selectedOrder ? parseFloat(selectedOrder.iva).toLocaleString() : '0'}
                                </Text>
                            </View>
                            <View style={[styles.summaryRow, { borderTopWidth: 1, borderTopColor: '#e2e8f0', paddingTop: 8, marginTop: 8 }]}>
                                <Text style={[styles.summaryLabel, styles.boldText]}>Total del Pedido:</Text>
                                <Text style={[styles.summaryValue, styles.boldText, { color: '#2563eb' }]}>
                                    ₡{selectedOrder ? parseFloat(selectedOrder.total).toLocaleString() : '0'}
                                </Text>
                            </View>
                        </View>

                        <TouchableOpacity 
                            style={styles.closeDetailBtn} 
                            onPress={() => setDetailsModalVisible(false)}
                        >
                            <Text style={styles.closeDetailBtnText}>Cerrar</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#ffffff',
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0',
        flexWrap: 'wrap',
        gap: 10,
    },
    backButton: {
        marginRight: 15,
        padding: 5,
    },
    backButtonText: {
        color: '#2563eb',
        fontSize: 18,
        fontWeight: 'bold',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1e293b',
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    tabContainer: {
        flexDirection: 'row',
        backgroundColor: '#ffffff',
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0',
    },
    tabButton: {
        flex: 1,
        paddingVertical: 14,
        alignItems: 'center',
        borderBottomWidth: 2,
        borderBottomColor: 'transparent',
    },
    tabButtonActive: {
        borderBottomColor: '#2563eb',
    },
    tabButtonText: {
        fontSize: 14,
        color: '#64748b',
        fontWeight: '600',
    },
    tabButtonTextActive: {
        color: '#2563eb',
    },
    listContent: {
        padding: 16,
        paddingBottom: 90,
    },
    noDataText: {
        textAlign: 'center',
        color: '#64748b',
        fontSize: 16,
        marginTop: 40,
        fontStyle: 'italic',
    },
    productCard: {
        backgroundColor: '#ffffff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        shadowColor: '#0f172a',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    productHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    productEmoji: {
        fontSize: 28,
        marginRight: 12,
    },
    productName: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#1e293b',
    },
    productStock: {
        fontSize: 12,
        color: '#64748b',
        marginTop: 2,
    },
    productPrice: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#2563eb',
        marginLeft: 10,
    },
    productDesc: {
        fontSize: 13,
        color: '#475569',
        lineHeight: 18,
        marginBottom: 12,
    },
    productActionRow: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        alignItems: 'center',
    },
    buyBtn: {
        backgroundColor: '#2563eb',
        borderRadius: 8,
        paddingVertical: 8,
        paddingHorizontal: 16,
    },
    buyBtnText: {
        color: '#ffffff',
        fontWeight: 'bold',
        fontSize: 14,
    },
    disabledBtn: {
        backgroundColor: '#cbd5e1',
    },
    quantityStepper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f1f5f9',
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#cbd5e1',
    },
    stepperBtn: {
        paddingVertical: 6,
        paddingHorizontal: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    stepperBtnText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#334155',
    },
    stepperValue: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#1e293b',
        paddingHorizontal: 10,
    },
    cartBar: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#1e293b',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 20,
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
    },
    cartBarCount: {
        color: '#94a3b8',
        fontSize: 12,
    },
    cartBarTotal: {
        color: '#ffffff',
        fontSize: 16,
        fontWeight: 'bold',
        marginTop: 2,
    },
    cartBarBtn: {
        backgroundColor: '#2563eb',
        borderRadius: 8,
        paddingVertical: 8,
        paddingHorizontal: 16,
    },
    cartBarBtnText: {
        color: '#ffffff',
        fontWeight: 'bold',
        fontSize: 14,
    },
    orderCard: {
        backgroundColor: '#ffffff',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    orderHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
        paddingBottom: 10,
        marginBottom: 10,
    },
    orderCode: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#1e293b',
    },
    orderDate: {
        fontSize: 12,
        color: '#64748b',
        marginTop: 2,
    },
    statusBadge: {
        borderRadius: 6,
        paddingVertical: 4,
        paddingHorizontal: 8,
    },
    statusText: {
        fontSize: 11,
        fontWeight: 'bold',
    },
    orderFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    orderPrice: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#1e293b',
    },
    detailsBtn: {
        borderWidth: 1,
        borderColor: '#cbd5e1',
        borderRadius: 6,
        paddingVertical: 6,
        paddingHorizontal: 12,
    },
    detailsBtnText: {
        fontSize: 12,
        color: '#475569',
        fontWeight: '600',
    },
    alertBox: {
        marginTop: 10,
        padding: 10,
        borderRadius: 6,
        borderWidth: 1,
    },
    successAlert: {
        backgroundColor: '#f0fdf4',
        borderColor: '#dcfce7',
    },
    pendingAlert: {
        backgroundColor: '#fffbeb',
        borderColor: '#fef3c7',
    },
    alertText: {
        fontSize: 12,
        color: '#334155',
        lineHeight: 16,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(15, 23, 42, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    modalContent: {
        backgroundColor: '#ffffff',
        borderRadius: 16,
        width: '100%',
        maxWidth: 500,
        padding: 20,
        maxHeight: '90%',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1e293b',
        marginBottom: 15,
    },
    modalCartList: {
        maxHeight: 250,
        marginBottom: 15,
    },
    cartItemRow: {
        flexDirection: 'row',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
        paddingVertical: 10,
    },
    cartItemName: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1e293b',
    },
    cartItemSub: {
        fontSize: 12,
        color: '#64748b',
        marginTop: 2,
    },
    stepperInCart: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f8fafc',
        borderRadius: 6,
        borderWidth: 1,
        borderColor: '#cbd5e1',
        marginHorizontal: 10,
    },
    stepperInCartBtn: {
        paddingVertical: 4,
        paddingHorizontal: 8,
    },
    stepperInCartBtnText: {
        fontSize: 15,
        fontWeight: 'bold',
        color: '#475569',
    },
    stepperInCartValue: {
        fontSize: 13,
        fontWeight: 'bold',
        color: '#1e293b',
        paddingHorizontal: 6,
    },
    removeCartBtn: {
        padding: 6,
    },
    removeCartBtnText: {
        fontSize: 16,
    },
    summaryCard: {
        backgroundColor: '#f8fafc',
        borderRadius: 10,
        padding: 12,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        marginBottom: 15,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginVertical: 4,
    },
    summaryLabel: {
        fontSize: 13,
        color: '#64748b',
    },
    summaryValue: {
        fontSize: 13,
        color: '#334155',
        fontWeight: '500',
    },
    boldText: {
        fontWeight: 'bold',
    },
    modalActionButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    modalBtn: {
        flex: 1,
        borderRadius: 8,
        padding: 12,
        alignItems: 'center',
        marginHorizontal: 5,
    },
    cancelModalBtn: {
        backgroundColor: '#f1f5f9',
    },
    cancelModalBtnText: {
        color: '#475569',
        fontWeight: 'bold',
        fontSize: 13,
    },
    saveModalBtn: {
        backgroundColor: '#2563eb',
    },
    saveModalBtnText: {
        color: '#ffffff',
        fontWeight: 'bold',
        fontSize: 13,
    },
    successIcon: {
        fontSize: 50,
        marginBottom: 10,
    },
    successTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#15803d',
        textAlign: 'center',
        marginBottom: 10,
    },
    successDesc: {
        fontSize: 14,
        color: '#475569',
        textAlign: 'center',
        lineHeight: 20,
        marginBottom: 15,
    },
    codeContainer: {
        backgroundColor: '#f0fdf4',
        borderWidth: 2,
        borderColor: '#bbf7d0',
        borderStyle: 'dashed',
        borderRadius: 10,
        paddingVertical: 12,
        paddingHorizontal: 25,
        marginBottom: 15,
    },
    codeText: {
        fontSize: 26,
        fontWeight: 'bold',
        color: '#16a34a',
        letterSpacing: 2,
    },
    instructionText: {
        fontSize: 12,
        color: '#64748b',
        textAlign: 'center',
        lineHeight: 18,
        marginBottom: 20,
    },
    successCloseBtn: {
        backgroundColor: '#16a34a',
        borderRadius: 8,
        paddingVertical: 12,
        paddingHorizontal: 40,
    },
    successCloseBtnText: {
        color: '#ffffff',
        fontWeight: 'bold',
        fontSize: 15,
    },
    detailItemRow: {
        flexDirection: 'row',
        alignItems: 'center',
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
        paddingVertical: 10,
    },
    detailItemEmoji: {
        fontSize: 22,
        marginRight: 10,
    },
    detailItemName: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1e293b',
    },
    detailItemPrice: {
        fontSize: 12,
        color: '#64748b',
        marginTop: 2,
    },
    detailItemSubtotal: {
        fontSize: 13,
        fontWeight: 'bold',
        color: '#334155',
    },
    closeDetailBtn: {
        backgroundColor: '#2563eb',
        borderRadius: 8,
        padding: 12,
        alignItems: 'center',
        marginTop: 10,
    },
    closeDetailBtnText: {
        color: '#ffffff',
        fontWeight: 'bold',
    },
    orderPendingActions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginTop: 10,
        gap: 10,
        borderTopWidth: 1,
        borderTopColor: '#f1f5f9',
        paddingTop: 10,
    },
    actionBtn: {
        borderRadius: 6,
        paddingVertical: 6,
        paddingHorizontal: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    editOrderBtn: {
        borderWidth: 1,
        borderColor: '#3b82f6',
        backgroundColor: '#eff6ff',
    },
    editOrderBtnText: {
        color: '#2563eb',
        fontSize: 12,
        fontWeight: 'bold',
    },
    cancelOrderBtn: {
        borderWidth: 1,
        borderColor: '#fca5a5',
        backgroundColor: '#fee2e2',
    },
    cancelOrderBtnText: {
        color: '#ef4444',
        fontSize: 12,
        fontWeight: 'bold',
    },
    statusFiltersScroll: {
        backgroundColor: '#ffffff',
        maxHeight: 46,
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0',
    },
    statusFilters: {
        flexDirection: 'row',
        paddingVertical: 6,
        paddingHorizontal: 16,
        alignItems: 'center',
    },
    filterChip: {
        paddingVertical: 5,
        paddingHorizontal: 12,
        borderRadius: 20,
        backgroundColor: '#f8fafc',
        marginRight: 8,
        borderWidth: 1,
        borderColor: '#e2e8f0',
    },
    filterChipActive: {
        backgroundColor: '#eff6ff',
        borderColor: '#2563eb',
    },
    filterChipText: {
        fontSize: 12,
        color: '#64748b',
        fontWeight: '600',
    },
    filterChipTextActive: {
        color: '#2563eb',
        fontWeight: 'bold',
    },
});
