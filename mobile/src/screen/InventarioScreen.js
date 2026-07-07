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
    TextInput,
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

export default function InventarioScreen({ navigation }) {
    const [user, setUser] = useState(null);
    const [activeTab, setActiveTab] = useState('inventario'); // 'inventario' | 'pedidos'
    const [productos, setProductos] = useState([]);
    const [pedidos, setPedidos] = useState([]);
    
    // Order Filter State
    const [orderFilter, setOrderFilter] = useState('todos'); // 'todos' | 'pendiente' | 'preparando' | 'listo' | 'retirado' | 'cancelado'

    const [loadingProducts, setLoadingProducts] = useState(true);
    const [loadingOrders, setLoadingOrders] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);

    // Product Form Modal States
    const [productModalVisible, setProductModalVisible] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [nombre, setNombre] = useState('');
    const [descripcion, setDescripcion] = useState('');
    const [precio, setPrecio] = useState('');
    const [stock, setStock] = useState('');
    const [activo, setActivo] = useState(1);
    const [iva, setIva] = useState('13');
    const [searchQuery, setSearchQuery] = useState('');
    const [formErrors, setFormErrors] = useState({});

    // Order Details Modal States
    const [detailsModalVisible, setDetailsModalVisible] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [orderDetails, setOrderDetails] = useState([]);
    const [loadingDetails, setLoadingDetails] = useState(false);

    const loadUser = async () => {
        try {
            const userData = await AsyncStorage.getItem('user');
            if (userData) {
                const parsed = JSON.parse(userData);
                setUser(parsed);
                if (parsed.rol !== 'admin') {
                    showAlert('Acceso Denegado', 'Esta pantalla es de uso exclusivo para administradores.');
                    navigation.replace('Dashboard');
                }
            }
        } catch (err) {
            console.error('Error al cargar datos del administrador:', err);
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
            showAlert('Error', 'No se pudo cargar el listado de inventario.');
        } finally {
            setLoadingProducts(false);
        }
    };

    const loadAllOrders = async () => {
        setLoadingOrders(true);
        try {
            const response = await api.get('/pedidos');
            if (response.data.success) {
                setPedidos(response.data.data);
            }
        } catch (err) {
            console.error('Error al cargar pedidos:', err);
            showAlert('Error', 'No se pudieron cargar los pedidos recibidos.');
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
            loadAllOrders();
        } else {
            loadProducts();
        }
    }, [activeTab]);

    useEffect(() => {
        setSearchQuery('');
    }, [activeTab]);

    // Product CRUD handlers
    const openAddProductModal = () => {
        setEditingProduct(null);
        setNombre('');
        setDescripcion('');
        setPrecio('');
        setStock('');
        setActivo(1);
        setIva('13');
        setFormErrors({});
        setProductModalVisible(true);
    };

    const openEditProductModal = (product) => {
        setEditingProduct(product);
        setNombre(product.nombre);
        setDescripcion(product.descripcion || '');
        setPrecio(product.precio.toString());
        setStock(product.stock.toString());
        setActivo(product.activo);
        setIva((product.iva !== null && product.iva !== undefined ? product.iva : 13).toString());
        setFormErrors({});
        setProductModalVisible(true);
    };

    const validateForm = () => {
        const errors = {};
        if (!nombre.trim()) errors.nombre = 'El nombre es obligatorio';
        if (!precio.trim() || isNaN(parseFloat(precio)) || parseFloat(precio) <= 0) {
            errors.precio = 'El precio debe ser un número mayor a 0';
        }
        if (!stock.trim() || isNaN(parseInt(stock)) || parseInt(stock) < 0) {
            errors.stock = 'El stock debe ser un entero mayor o igual a 0';
        }
        if (!iva.trim() || isNaN(parseInt(iva)) || parseInt(iva) < 0 || parseInt(iva) > 100) {
            errors.iva = 'El IVA debe ser un entero entre 0 y 100';
        }
        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSaveProduct = async () => {
        if (!validateForm()) return;
        setActionLoading(true);
        try {
            const productBody = {
                nombre: nombre.trim(),
                descripcion: descripcion.trim(),
                precio: parseFloat(precio),
                stock: parseInt(stock),
                activo: activo,
                iva: parseInt(iva)
            };

            let response;
            if (editingProduct) {
                response = await api.put(`/productos/${editingProduct.id}`, productBody);
            } else {
                response = await api.post('/productos', productBody);
            }

            if (response.data.success) {
                showAlert('Éxito', editingProduct ? 'Producto actualizado correctamente.' : 'Producto registrado en el inventario.');
                setProductModalVisible(false);
                loadProducts();
            }
        } catch (err) {
            console.error('Error al guardar producto:', err);
            showAlert('Error', err.response?.data?.message || 'No se pudo guardar el producto.');
        } finally {
            setActionLoading(false);
        }
    };

    const toggleProductStatus = async (product) => {
        const confirmMsg = product.activo 
            ? `¿Seguro que deseas desactivar el producto "${product.nombre}" del catálogo?`
            : `¿Deseas activar nuevamente el producto "${product.nombre}"?`;
            
        if (Platform.OS === 'web') {
            if (!confirm(confirmMsg)) return;
        } else {
            // Confirmación móvil omitida para simplicidad o alert confirm
        }

        try {
            const updatedActivo = product.activo ? 0 : 1;
            const response = await api.put(`/productos/${product.id}`, {
                nombre: product.nombre,
                descripcion: product.descripcion,
                precio: product.precio,
                stock: product.stock,
                activo: updatedActivo,
                iva: product.iva !== null && product.iva !== undefined ? product.iva : 13
            });
            if (response.data.success) {
                loadProducts();
            }
        } catch (err) {
            console.error('Error al cambiar estado del producto:', err);
            showAlert('Error', 'No se pudo cambiar el estado del producto.');
        }
    };

    // Order status workflow handlers
    const updateOrderStatus = async (orderId, newStatus) => {
        try {
            const response = await api.put(`/pedidos/${orderId}/estado`, { estado: newStatus });
            if (response.data.success) {
                loadAllOrders();
            }
        } catch (err) {
            console.error('Error al actualizar estado de pedido:', err);
            showAlert('Error', 'No se pudo cambiar el estado del pedido.');
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

    const filteredProductos = productos.filter(p => {
        const q = searchQuery.toLowerCase().trim();
        if (!q) return true;
        return (p.nombre || '').toLowerCase().includes(q) || 
               (p.descripcion || '').toLowerCase().includes(q);
    });

    const filteredPedidos = pedidos.filter(p => {
        if (orderFilter !== 'todos' && p.estado !== orderFilter) return false;

        const q = searchQuery.toLowerCase().trim();
        if (!q) return true;
        return (p.codigo_retiro || '').toLowerCase().includes(q) ||
               (p.usuario_nombre || '').toLowerCase().includes(q) ||
               (p.usuario_email || '').toLowerCase().includes(q);
    });

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <TouchableOpacity onPress={() => navigation.replace('Dashboard')} style={styles.backButton}>
                        <Text style={styles.backButtonText}>‹ Volver</Text>
                    </TouchableOpacity>
                    <Text style={styles.headerTitle}>📦 Inventario y Pedidos</Text>
                </View>
                {activeTab === 'inventario' && (
                    <TouchableOpacity style={styles.headerAddBtn} onPress={openAddProductModal}>
                        <Text style={styles.headerAddBtnText}>➕ Nuevo Producto</Text>
                    </TouchableOpacity>
                )}
            </View>

            {/* Navigation Tabs */}
            <View style={styles.tabContainer}>
                <TouchableOpacity
                    style={[styles.tabButton, activeTab === 'inventario' && styles.tabButtonActive]}
                    onPress={() => setActiveTab('inventario')}
                >
                    <Text style={[styles.tabButtonText, activeTab === 'inventario' && styles.tabButtonTextActive]}>
                        📦 Inventario
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tabButton, activeTab === 'pedidos' && styles.tabButtonActive]}
                    onPress={() => setActiveTab('pedidos')}
                >
                    <Text style={[styles.tabButtonText, activeTab === 'pedidos' && styles.tabButtonTextActive]}>
                        📋 Pedidos Clientes
                    </Text>
                </TouchableOpacity>
            </View>

            {activeTab === 'inventario' ? (
                <View style={{ flex: 1 }}>
                    {!loadingProducts && (
                        <View style={styles.searchContainer}>
                            <TextInput
                                style={styles.searchInput}
                                placeholder="🔍 Buscar producto en el inventario..."
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                                placeholderTextColor="#94a3b8"
                            />
                        </View>
                    )}
                    <ScrollView contentContainerStyle={styles.listContent} persistentScrollbar={true}>
                        {loadingProducts ? (
                            <ActivityIndicator size="large" color="#2563eb" style={{ marginTop: 40 }} />
                        ) : filteredProductos.length === 0 ? (
                            <Text style={styles.noDataText}>No se encontraron productos registrados.</Text>
                        ) : (
                            filteredProductos.map(p => (
                                <View key={p.id} style={[styles.productCard, !p.activo && styles.productCardInactive]}>
                                    <View style={styles.productHeader}>
                                        <Text style={styles.productEmoji}>{getProductEmoji(p.nombre)}</Text>
                                        <View style={{ flex: 1 }}>
                                            <Text style={[styles.productName, !p.activo && styles.textLineThrough]}>
                                                {p.nombre}
                                            </Text>
                                            <Text style={[styles.productStock, p.stock <= 5 && styles.lowStockText]}>
                                                Stock: {p.stock} uds {p.stock <= 5 && '⚠️ (Bajo stock)'}
                                            </Text>
                                        </View>
                                        <View style={{ alignItems: 'flex-end' }}>
                                            <Text style={styles.productPrice}>₡{parseFloat(p.precio).toLocaleString()}</Text>
                                            <Text style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>+ IVA: {p.iva !== null && p.iva !== undefined ? p.iva : 13}%</Text>
                                        </View>
                                    </View>
                                    <Text style={styles.productDesc}>{p.descripcion || 'Sin descripción.'}</Text>
                                    
                                    <View style={styles.productActionRow}>
                                        <TouchableOpacity 
                                            style={[styles.statusToggleBtn, { backgroundColor: p.activo ? '#fee2e2' : '#dcfce7' }]}
                                            onPress={() => toggleProductStatus(p)}
                                        >
                                            <Text style={[styles.statusToggleBtnText, { color: p.activo ? '#ef4444' : '#16a34a' }]}>
                                                {p.activo ? 'Desactivar' : 'Activar'}
                                            </Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity 
                                            style={styles.editBtn} 
                                            onPress={() => openEditProductModal(p)}
                                        >
                                            <Text style={styles.editBtnText}>✏️ Editar</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            ))
                        )}
                    </ScrollView>
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

                    {!loadingOrders && (
                        <View style={styles.searchContainer}>
                            <TextInput
                                style={styles.searchInput}
                                placeholder="🔍 Buscar pedido por código, nombre de cliente, correo..."
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                                placeholderTextColor="#94a3b8"
                            />
                        </View>
                    )}

                    <ScrollView contentContainerStyle={[styles.listContent, { paddingTop: 0 }]} persistentScrollbar={true}>
                        {loadingOrders ? (
                            <ActivityIndicator size="large" color="#2563eb" style={{ marginTop: 40 }} />
                        ) : filteredPedidos.length === 0 ? (
                            <Text style={styles.noDataText}>No se encontraron pedidos con este filtro.</Text>
                        ) : (
                            filteredPedidos.map(o => {
                                const statusInfo = getStatusColor(o.estado);
                                return (
                                    <View key={o.id} style={styles.orderCard}>
                                        <View style={styles.orderHeader}>
                                            <View style={{ flex: 1 }}>
                                                <Text style={styles.orderCode}>Código: {o.codigo_retiro}</Text>
                                                <Text style={styles.orderDate}>Fecha: {new Date(o.fecha_pedido).toLocaleDateString()}</Text>
                                                <Text style={styles.orderClient}>👤 Cliente: {o.usuario_nombre} ({o.usuario_email})</Text>
                                            </View>
                                            <View style={[styles.statusBadge, { backgroundColor: statusInfo.bg }]}>
                                                <Text style={[styles.statusText, { color: statusInfo.text }]}>
                                                    {statusInfo.label}
                                                </Text>
                                            </View>
                                        </View>

                                        {/* Actions Workflow Bar */}
                                        <View style={styles.orderActionsRow}>
                                            <TouchableOpacity style={styles.detailsBtn} onPress={() => fetchOrderDetails(o)}>
                                                <Text style={styles.detailsBtnText}>🔍 Ver Detalle</Text>
                                            </TouchableOpacity>

                                            <View style={styles.statusWorkflowBtns}>
                                                {o.estado === 'pendiente' && (
                                                    <>
                                                        <TouchableOpacity 
                                                            style={[styles.workflowBtn, { backgroundColor: '#fee2e2' }]}
                                                            onPress={() => updateOrderStatus(o.id, 'cancelado')}
                                                        >
                                                            <Text style={{ color: '#ef4444', fontSize: 11, fontWeight: 'bold' }}>❌ Cancelar</Text>
                                                        </TouchableOpacity>
                                                        <TouchableOpacity 
                                                            style={[styles.workflowBtn, { backgroundColor: '#dbeafe' }]}
                                                            onPress={() => updateOrderStatus(o.id, 'preparando')}
                                                        >
                                                            <Text style={{ color: '#1e40af', fontSize: 11, fontWeight: 'bold' }}>📦 Preparar</Text>
                                                        </TouchableOpacity>
                                                    </>
                                                )}
                                                {o.estado === 'preparando' && (
                                                    <>
                                                        <TouchableOpacity 
                                                            style={[styles.workflowBtn, { backgroundColor: '#fee2e2' }]}
                                                            onPress={() => updateOrderStatus(o.id, 'cancelado')}
                                                        >
                                                            <Text style={{ color: '#ef4444', fontSize: 11, fontWeight: 'bold' }}>❌ Cancelar</Text>
                                                        </TouchableOpacity>
                                                        <TouchableOpacity 
                                                            style={[styles.workflowBtn, { backgroundColor: '#dcfce7' }]}
                                                            onPress={() => updateOrderStatus(o.id, 'listo')}
                                                        >
                                                            <Text style={{ color: '#15803d', fontSize: 11, fontWeight: 'bold' }}>✅ Listo</Text>
                                                        </TouchableOpacity>
                                                    </>
                                                )}
                                                {o.estado === 'listo' && (
                                                    <>
                                                        <TouchableOpacity 
                                                            style={[styles.workflowBtn, { backgroundColor: '#fee2e2' }]}
                                                            onPress={() => updateOrderStatus(o.id, 'cancelado')}
                                                        >
                                                            <Text style={{ color: '#ef4444', fontSize: 11, fontWeight: 'bold' }}>❌ Cancelar</Text>
                                                        </TouchableOpacity>
                                                        <TouchableOpacity 
                                                            style={[styles.workflowBtn, { backgroundColor: '#e2e8f0' }]}
                                                            onPress={() => updateOrderStatus(o.id, 'retirado')}
                                                        >
                                                            <Text style={{ color: '#475569', fontSize: 11, fontWeight: 'bold' }}>🤝 Entregar</Text>
                                                        </TouchableOpacity>
                                                    </>
                                                )}
                                            </View>
                                        </View>
                                    </View>
                                );
                            })
                        )}
                    </ScrollView>
                </View>
            )}

            {/* Modal de Formulario de Producto (Crear / Editar) */}
            <Modal
                animationType="slide"
                transparent={true}
                visible={productModalVisible}
                onRequestClose={() => setProductModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>
                            {editingProduct ? '✏️ Editar Producto Exótico' : '📦 Registrar Nuevo Producto Exótico'}
                        </Text>

                        <ScrollView style={{ marginBottom: 15 }}>
                            <Text style={styles.label}>Nombre del Producto *</Text>
                            <TextInput 
                                style={[styles.input, formErrors.nombre && styles.inputError]}
                                placeholder="Ej. Alimento para Tortugas de Agua"
                                value={nombre}
                                onChangeText={setNombre}
                            />
                            {formErrors.nombre && <Text style={styles.errorText}>{formErrors.nombre}</Text>}

                            <Text style={styles.label}>Precio (₡) *</Text>
                            <TextInput 
                                style={[styles.input, formErrors.precio && styles.inputError]}
                                placeholder="Ej. 6500"
                                value={precio}
                                onChangeText={setPrecio}
                                keyboardType="numeric"
                            />
                            {formErrors.precio && <Text style={styles.errorText}>{formErrors.precio}</Text>}

                            <Text style={styles.label}>IVA (%) *</Text>
                            <TextInput 
                                style={[styles.input, formErrors.iva && styles.inputError]}
                                placeholder="Ej. 13"
                                value={iva}
                                onChangeText={setIva}
                                keyboardType="numeric"
                            />
                            {formErrors.iva && <Text style={styles.errorText}>{formErrors.iva}</Text>}

                            <Text style={styles.label}>Stock Inicial *</Text>
                            <TextInput 
                                style={[styles.input, formErrors.stock && styles.inputError]}
                                placeholder="Ej. 10"
                                value={stock}
                                onChangeText={setStock}
                                keyboardType="numeric"
                            />
                            {formErrors.stock && <Text style={styles.errorText}>{formErrors.stock}</Text>}

                            <Text style={styles.label}>Descripción</Text>
                            <TextInput 
                                style={[styles.input, styles.textArea]}
                                placeholder="Describe el uso del producto, peso, tamaño, para qué animales se recomienda, etc."
                                value={descripcion}
                                onChangeText={setDescripcion}
                                multiline={true}
                                numberOfLines={3}
                            />

                            {editingProduct && (
                                <View style={styles.switchRow}>
                                    <Text style={styles.label}>Habilitado en Catálogo</Text>
                                    <View style={{ flexDirection: 'row' }}>
                                        <TouchableOpacity 
                                            style={[styles.switchBtn, activo === 1 && styles.switchBtnActive]} 
                                            onPress={() => setActivo(1)}
                                        >
                                            <Text style={[styles.switchBtnText, activo === 1 && styles.switchBtnTextActive]}>SÍ</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity 
                                            style={[styles.switchBtn, activo === 0 && styles.switchBtnActive]} 
                                            onPress={() => setActivo(0)}
                                        >
                                            <Text style={[styles.switchBtnText, activo === 0 && styles.switchBtnTextActive]}>NO</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            )}
                        </ScrollView>

                        <View style={styles.modalActionButtons}>
                            <TouchableOpacity 
                                style={[styles.modalBtn, styles.cancelModalBtn]} 
                                onPress={() => setProductModalVisible(false)}
                            >
                                <Text style={styles.cancelModalBtnText}>Cancelar</Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                                style={[styles.modalBtn, styles.saveModalBtn]} 
                                onPress={handleSaveProduct}
                                disabled={actionLoading}
                            >
                                {actionLoading ? (
                                    <ActivityIndicator color="#fff" />
                                ) : (
                                    <Text style={styles.saveModalBtnText}>Guardar Producto</Text>
                                )}
                            </TouchableOpacity>
                        </View>
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
                        <Text style={styles.modalTitle}>📋 Detalle Pedido: {selectedOrder?.codigo_retiro}</Text>

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
                                <Text style={[styles.summaryLabel, styles.boldText]}>Total:</Text>
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
    headerAddBtn: {
        backgroundColor: '#2563eb',
        borderRadius: 8,
        paddingVertical: 8,
        paddingHorizontal: 12,
    },
    headerAddBtnText: {
        color: '#ffffff',
        fontWeight: 'bold',
        fontSize: 12,
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
        paddingBottom: 60,
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
    productCardInactive: {
        backgroundColor: '#f8fafc',
        borderColor: '#cbd5e1',
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
    textLineThrough: {
        textDecorationLine: 'line-through',
        color: '#94a3b8',
    },
    productStock: {
        fontSize: 12,
        color: '#64748b',
        marginTop: 2,
    },
    lowStockText: {
        color: '#ef4444',
        fontWeight: 'bold',
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
        borderTopWidth: 1,
        borderTopColor: '#f1f5f9',
        paddingTop: 10,
        gap: 10,
    },
    statusToggleBtn: {
        borderRadius: 6,
        paddingVertical: 6,
        paddingHorizontal: 12,
    },
    statusToggleBtnText: {
        fontSize: 12,
        fontWeight: 'bold',
    },
    editBtn: {
        borderWidth: 1,
        borderColor: '#cbd5e1',
        borderRadius: 6,
        paddingVertical: 6,
        paddingHorizontal: 12,
        backgroundColor: '#fafafa',
    },
    editBtnText: {
        color: '#475569',
        fontWeight: 'bold',
        fontSize: 12,
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
    orderClient: {
        fontSize: 13,
        fontWeight: '500',
        color: '#475569',
        marginTop: 4,
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
    orderActionsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
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
    statusWorkflowBtns: {
        flexDirection: 'row',
        gap: 6,
    },
    workflowBtn: {
        borderRadius: 6,
        paddingVertical: 6,
        paddingHorizontal: 10,
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
    label: {
        fontSize: 13,
        fontWeight: '600',
        color: '#334155',
        marginTop: 12,
        marginBottom: 4,
    },
    input: {
        borderWidth: 1,
        borderColor: '#cbd5e1',
        borderRadius: 8,
        padding: 10,
        fontSize: 15,
        backgroundColor: '#f8fafc',
        marginBottom: 5,
    },
    inputError: {
        borderColor: '#ef4444',
        backgroundColor: '#fef2f2',
    },
    errorText: {
        fontSize: 11,
        color: '#ef4444',
        marginBottom: 8,
    },
    textArea: {
        height: 70,
        textAlignVertical: 'top',
    },
    switchRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 15,
        marginBottom: 5,
    },
    switchBtn: {
        borderWidth: 1,
        borderColor: '#cbd5e1',
        paddingVertical: 6,
        paddingHorizontal: 16,
        backgroundColor: '#f1f5f9',
    },
    switchBtnActive: {
        backgroundColor: '#2563eb',
        borderColor: '#2563eb',
    },
    switchBtnText: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#475569',
    },
    switchBtnTextActive: {
        color: '#ffffff',
    },
    modalActionButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 15,
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
    },
    saveModalBtn: {
        backgroundColor: '#2563eb',
    },
    saveModalBtnText: {
        color: '#ffffff',
        fontWeight: 'bold',
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
    searchContainer: {
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: 4,
        backgroundColor: '#f8fafc',
    },
    searchInput: {
        backgroundColor: '#ffffff',
        borderWidth: 1,
        borderColor: '#cbd5e1',
        borderRadius: 10,
        paddingVertical: 10,
        paddingHorizontal: 16,
        fontSize: 15,
        color: '#1e293b',
    },
});
