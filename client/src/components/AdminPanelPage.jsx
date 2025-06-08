import React, { useState, useEffect } from 'react';
import { FaTags, FaCogs, FaUsers, FaBuilding, FaExpandArrowsAlt, FaCompressArrowsAlt } from 'react-icons/fa';
import axios from 'axios';
import '../styles/AdminPanelPage.css';
import { toast } from 'react-toastify';
import { getToken } from "../utils/auth";
import { useNavigate } from 'react-router-dom';

const AdminPanelPage = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('categories');
    const [editingItem, setEditingItem] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [categories, setCategories] = useState([]);
    const [services, setServices] = useState([]);
    const [users, setUsers] = useState([]);
    const [businesses, setBusinesses] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedFile, setSelectedFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedNodes, setExpandedNodes] = useState({});

    const hebrewWeekdays = {
        0: 'ראשון',
        1: 'שני',
        2: 'שלישי',
        3: 'רביעי',
        4: 'חמישי',
        5: 'שישי',
        6: 'שבת'
    };

    const roleTranslations = {
        'admin': 'מנהל',
        'manager': 'מנהל מערכת',
        'end-user': 'משתמש'
    };

    useEffect(() => {
        const user = JSON.parse(localStorage.getItem('user'));
        if (!user || user.role !== 'admin') {
            toast.error("אין לך הרשאת גישה לדף זה.");
            navigate('/');
            return;
        }
        fetchData();
    }, [activeTab]);

    const getContextName = (tab, isPlural = false) => {
        switch (tab) {
            case 'categories': return isPlural ? 'קטגוריות' : 'קטגוריה';
            case 'services': return isPlural ? 'שירותים' : 'שירות';
            case 'users': return isPlural ? 'משתמשים' : 'משתמש';
            case 'businesses': return isPlural ? 'עסקים' : 'עסק';
            default: return isPlural ? 'פריטים' : 'פריט';
        }
    };

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const token = getToken();
            const config = { headers: { Authorization: `Bearer ${token}` } };
            
            let categoriesData = categories;
            if (categories.length === 0 || activeTab === 'categories' || activeTab === 'services') {
                const catRes = await axios.get(`${process.env.REACT_APP_API_DOMAIN}/api/v1/categories`, config);
                categoriesData = catRes.data.sort((a, b) => a.name.localeCompare(b.name));
                setCategories(categoriesData);
            }

            switch (activeTab) {
                case 'services':
                    const servicesRes = await axios.get(`${process.env.REACT_APP_API_DOMAIN}/api/v1/services`, config);
                    const categoryMap = categoriesData.reduce((acc, cat) => {
                        acc[cat._id] = cat.name;
                        return acc;
                    }, {});
                    const sortedServices = servicesRes.data.sort((a, b) => {
                        const catA = categoryMap[a.categoryId] || '';
                        const catB = categoryMap[b.categoryId] || '';
                        if (catA < catB) return -1;
                        if (catA > catB) return 1;
                        return a.name.localeCompare(b.name);
                    });
                    setServices(sortedServices);
                    break;
                case 'users':
                    const usersResponse = await axios.get(`${process.env.REACT_APP_API_DOMAIN}/api/v1/users`, config);
                    setUsers(usersResponse.data);
                    break;
                case 'businesses':
                    const businessesResponse = await axios.get(`${process.env.REACT_APP_API_DOMAIN}/api/v1/businesses/all`, config);
                    setBusinesses(businessesResponse.data);
                    break;
                default:
                    break;
            }
        } catch (error) {
            console.error('Error fetching data:', error);
            toast.error('שגיאה בטעינת הנתונים');
        } finally {
            setIsLoading(false);
        }
    };

    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            setSelectedFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviewUrl(reader.result);
                setEditingItem(prev => ({ ...prev, logo: file }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleEdit = (item) => {
        setEditingItem(item);
        setPreviewUrl(item.logo || '');
        setIsModalOpen(true);
    };

    const handleDelete = async (id) => {
        const contextName = getContextName(activeTab);
        const toastId = toast.info(
            <div className="delete-confirmation">
                <p>{`האם אתה בטוח שברצונך למחוק ${contextName} זה?`}</p>
                <div className="confirmation-buttons">
                    <button onClick={async () => {
                        toast.dismiss(toastId);
                        try {
                            const token = getToken();
                            const config = { headers: { Authorization: `Bearer ${token}` } };
                            const endpoint = `${process.env.REACT_APP_API_DOMAIN}/api/v1/${activeTab}/${id}`;
                            await axios.delete(endpoint, config);
                            toast.success(`${contextName} נמחק בהצלחה`);
                            fetchData();
                        } catch (error) {
                            console.error('Error deleting item:', error);
                            toast.error(error.response?.data?.message || `שגיאה במחיקת ${contextName}`);
                        }
                    }}>כן, מחק</button>
                    <button onClick={() => toast.dismiss(toastId)}>ביטול</button>
                </div>
            </div>,
            { autoClose: false, closeButton: false, position: "top-center" }
        );
    };

    const handleSave = async () => {
        const token = getToken();
        let payload;
        let config = {
            headers: {
                Authorization: `Bearer ${token}`
            }
        };

        if (activeTab === 'categories') {
            payload = new FormData();
            Object.keys(editingItem).forEach(key => {
                if (key === 'logo' && editingItem[key] instanceof File) {
                    payload.append('logo', editingItem[key]);
                } else if (editingItem[key] != null) {
                    payload.append(key, editingItem[key]);
                }
            });
            config.headers['Content-Type'] = 'multipart/form-data';
        } else {
            payload = { ...editingItem };
            config.headers['Content-Type'] = 'application/json';
        }

        try {
            const contextName = getContextName(activeTab);
            const endpoint = `${process.env.REACT_APP_API_DOMAIN}/api/v1/${activeTab}`;
            if (editingItem._id) {
                await axios.put(`${endpoint}/${editingItem._id}`, payload, config);
                toast.success(`${contextName} עודכן בהצלחה`);
            } else {
                await axios.post(endpoint, payload, config);
                toast.success(`${contextName} נוסף בהצלחה`);
            }
            setIsModalOpen(false);
            setEditingItem(null);
            setSelectedFile(null);
            setPreviewUrl('');
            fetchData();
        } catch (error) {
            console.error('Error saving item:', error);
            const contextName = getContextName(activeTab);
            toast.error(error.response?.data?.message || `שגיאה בשמירת ה${contextName}`);
        }
    };
    
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setEditingItem(prev => ({ ...prev, [name]: value }));
    };

    const toggleNode = (nodeId) => {
        setExpandedNodes(prev => ({ ...prev, [nodeId]: !prev[nodeId] }));
    };

    const expandAll = (nodes, isExpanded) => {
        let newExpanded = {};
        const gatherIds = (node) => {
            if (node && typeof node === 'object') {
                const id = node._id || node.id || Math.random().toString();
                newExpanded[id] = isExpanded;
                if(isExpanded){
                    Object.values(node).forEach(gatherIds);
                }
            } else if (Array.isArray(node)) {
                node.forEach(gatherIds);
            }
        };
        nodes.forEach(gatherIds);
        setExpandedNodes(newExpanded);
    };

    const renderTree = (data, parentKey = 'root') => {
        if (!data) return null;

        const highlightText = (text) => {
            if (!searchTerm || typeof text !== 'string') return text;
            const parts = text.split(new RegExp(`(${searchTerm})`, 'gi'));
            return (
                <>
                    {parts.map((part, index) =>
                        part.toLowerCase() === searchTerm.toLowerCase() ? (
                            <span key={index} className="highlight">{part}</span>
                        ) : (
                            part
                        )
                    )}
                </>
            );
        };

        if (Array.isArray(data)) {
            return data.map((item, index) => renderTree(item, `${parentKey}.${index}`));
        }

        if (typeof data === 'object' && data !== null) {
            const nodeId = data._id || parentKey;
            const isExpanded = !!expandedNodes[nodeId];
            
            const objectToRender = {...data};

            const fieldOrder = [
                { key: 'name', label: 'שם' },
                { key: 'description', label: 'תיאור' },
                { key: 'address', label: 'כתובת' },
                { key: 'prefix', label: 'קידומת' },
                { key: 'phone', label: 'טלפון' },
                { key: 'email', label: 'אימייל' },
                { key: 'category', label: 'קטגוריה' },
                { key: 'services', label: 'שירותים' },
                { key: 'openingHours', label: 'שעות פתיחה' },
                { key: 'rating', label: 'דירוג' },
                { key: 'active', label: 'פעיל' },
                { key: 'logo', label: 'לוגו' },
                { key: 'userId', label: 'משתמש' },
                { key: 'feedbacks', label: 'פידבקים' }
            ];

            const hasChildren = parentKey === 'root' || Object.values(data).some(value => (typeof value === 'object' && value !== null) || (Array.isArray(value) && value.length > 0));
            const displayName = objectToRender.name || parentKey.split('.').pop();

            return (
                <div key={nodeId} className="tree-node">
                    <div className="tree-node-label" onClick={() => hasChildren && toggleNode(nodeId)}>
                        {hasChildren ? <span className={`arrow ${isExpanded ? 'expanded' : ''}`}>&#9654;</span> : <span className="arrow-placeholder"/>}
                        {highlightText(displayName)}
                    </div>
                    {isExpanded && hasChildren && (
                        <div className="tree-node-content">
                            {fieldOrder.map(({ key, label }) => {
                                const value = objectToRender[key];
                                if (value === undefined || value === null) return null;
                                
                                if (key === 'userId' && typeof value === 'object') {
                                    return <div key={key} className="tree-leaf"><strong>{highlightText(label)} ({key}):</strong> <span>{value.firstName} {value.lastName} (ID: {value._id})</span></div>;
                                }
                                
                                if (key === 'services' && Array.isArray(value)) {
                                    return (
                                        <div key={key} className="tree-node">
                                            <div className="tree-node-label" onClick={() => toggleNode(`${nodeId}.${key}`)}>
                                                <span className={`arrow ${expandedNodes[`${nodeId}.${key}`] ? 'expanded' : ''}`}>&#9654;</span>
                                                <strong>{highlightText(label)} ({key})</strong>
                                            </div>
                                            {expandedNodes[`${nodeId}.${key}`] && (
                                                <div className="tree-node-content">
                                                    {value.map(service => <div key={service._id} className="tree-leaf"><span>{highlightText(service.name)} (ID: {service._id})</span></div>)}
                                                </div>
                                            )}
                                        </div>
                                    );
                                }
                                
                                if (key === 'openingHours' && Array.isArray(value)) {
                                     return (
                                        <div key={key} className="tree-node">
                                            <div className="tree-node-label" onClick={() => toggleNode(`${nodeId}.${key}`)}>
                                                <span className={`arrow ${expandedNodes[`${nodeId}.${key}`] ? 'expanded' : ''}`}>&#9654;</span>
                                                <strong>{highlightText(label)} ({key})</strong>
                                            </div>
                                            {expandedNodes[`${nodeId}.${key}`] && (
                                                <div className="tree-node-content">
                                                    {value.map(oh => (
                                                        <div key={oh.day} className="tree-leaf">
                                                            <strong>{hebrewWeekdays[oh.day]}:</strong>
                                                            <span>{highlightText(oh.closed ? 'סגור' : oh.ranges.map(r => `${r.open}-${r.close}`).join(', '))}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    );
                                }

                                if (key === 'feedbacks' && Array.isArray(value)) {
                                    return (
                                        <div key={key} className="tree-node">
                                            <div className="tree-node-label" onClick={() => toggleNode(`${nodeId}.${key}`)}>
                                                <span className={`arrow ${expandedNodes[`${nodeId}.${key}`] ? 'expanded' : ''}`}>&#9654;</span>
                                                <strong>{highlightText(label)} ({key})</strong>
                                            </div>
                                            {expandedNodes[`${nodeId}.${key}`] && (
                                                <div className="tree-node-content">
                                                    {value.map(fb => (
                                                        <div key={fb._id} className="tree-node">
                                                            <div className="tree-node-label" onClick={() => toggleNode(`${nodeId}.feedbacks.${fb._id}`)}>
                                                                <span className={`arrow ${expandedNodes[`${nodeId}.feedbacks.${fb._id}`] ? 'expanded' : ''}`}>&#9654;</span>
                                                                <strong>{highlightText(`פידבק מאת ${fb.user_id ? `${fb.user_id.firstName} ${fb.user_id.lastName}`: 'Unknown User'}`)}</strong>
                                                            </div>
                                                            {expandedNodes[`${nodeId}.feedbacks.${fb._id}`] && (
                                                                <div className="tree-node-content">
                                                                    <div className="tree-leaf"><strong>ID:</strong> <span>{fb._id}</span></div>
                                                                    {fb.user_id && <div className="tree-leaf"><strong>User ID:</strong> <span>{fb.user_id._id}</span></div>}
                                                                    <div className="tree-leaf"><strong>Rating:</strong> <span>{highlightText(String(fb.rating))}</span></div>
                                                                    <div className="tree-leaf"><strong>Comment:</strong> <span>{highlightText(fb.comment || '(No comment)')}</span></div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    );
                                }
                                
                                return (
                                    <div key={key} className="tree-leaf">
                                        <strong>{highlightText(label)} ({key}):</strong> <span>{highlightText(String(value))}</span>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            );
        }
        return null;
    };

    const renderBusinessesTab = () => (
        <div className="admin-table-container">
            <div className="businesses-toolbar">
                <input
                    type="text"
                    placeholder="Search..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="search-input"
                />
                <button onClick={() => expandAll(businesses, true)} className="tree-button"><FaExpandArrowsAlt /> Expand All</button>
                <button onClick={() => expandAll(businesses, false)} className="tree-button"><FaCompressArrowsAlt/> Collapse All</button>
            </div>
            <div className="tree-container">
                {renderTree(businesses)}
            </div>
        </div>
    );

    const renderCategoriesTab = () => (
        <div className="admin-table-container">
            <button className="add-button" onClick={() => {
                setEditingItem({});
                setPreviewUrl('');
                setIsModalOpen(true);
            }}>
                + הוסף קטגוריה חדשה
            </button>
            <table className="admin-table">
                <thead>
                    <tr>
                        <th>לוגו</th>
                        <th>שם</th>
                        <th>פעולות</th>
                    </tr>
                </thead>
                <tbody>
                    {categories.map(category => (
                        <tr key={category._id}>
                            <td>
                                <img 
                                    src={category.logo ? `${process.env.REACT_APP_API_DOMAIN}${category.logo.replace(/\\/g, '/')}` : '/placeholder-logo.png'} 
                                    alt={category.name}
                                    className="category-logo"
                                />
                            </td>
                            <td>{category.name}</td>
                            <td className="actions-cell">
                                <button onClick={() => handleEdit(category)} className="edit-button">✏️</button>
                                <button onClick={() => handleDelete(category._id)} className="delete-button">🗑️</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );

    const renderServicesTab = () => {
        const groupedServices = services.reduce((acc, service) => {
            const categoryName = categories.find(c => c._id === service.categoryId)?.name || 'ללא קטגוריה';
            if (!acc[categoryName]) {
                acc[categoryName] = [];
            }
            acc[categoryName].push(service);
            return acc;
        }, {});

        return (
            <div className="admin-table-container">
                <button className="add-button" onClick={() => {
                    setEditingItem({});
                    setIsModalOpen(true);
                }}>
                    + הוסף שירות חדש
                </button>
                <table className="admin-table">
                    {Object.entries(groupedServices).map(([categoryName, servicesInCategory], index) => (
                        <tbody key={categoryName} className={`category-group group-color-${index % 5}`}>
                            <tr className="category-header-row">
                                <th colSpan="3">{categoryName}</th>
                            </tr>
                            {servicesInCategory.map(service => (
                                <tr key={service._id}>
                                    <td>{service.name}</td>
                                    <td className="actions-cell">
                                        <button onClick={() => handleEdit(service)} className="edit-button">✏️</button>
                                        <button onClick={() => handleDelete(service._id)} className="delete-button">🗑️</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    ))}
                </table>
            </div>
        );
    };
    const renderUsersTab = () => (
        <div className="admin-table-container">
            <table className="admin-table">
                <thead>
                    <tr>
                        <th>שם</th>
                        <th>Email</th>
                        <th>תפקיד</th>
                        <th>פעיל</th>
                        <th>פעולות</th>
                    </tr>
                </thead>
                <tbody>
                    {users.map(user => (
                        <tr key={user._id}>
                            <td>{user.firstName} {user.lastName}</td>
                            <td>{user.email}</td>
                            <td>{roleTranslations[user.role] || user.role}</td>
                            <td>{user.active ? 'כן' : 'לא'}</td>
                            <td className="actions-cell">
                                <button onClick={() => handleEdit(user)} className="edit-button">✏️</button>
                                <button onClick={() => handleDelete(user._id)} className="delete-button">🗑️</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );

    const renderForm = () => {
        if (!editingItem) return null;

        const isCategory = activeTab === 'categories';
        const isService = activeTab === 'services';
        const isUser = activeTab === 'users';

        return (
            <form onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
                {isCategory && (
                    <>
                        <div className="form-group">
                            <label htmlFor="name">שם קטגוריה</label>
                            <input
                                id="name"
                                name="name"
                                type="text"
                                value={editingItem.name || ''}
                                onChange={handleInputChange}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="logo-upload">לוגו</label>
                            <input
                                id="logo-upload"
                                name="logo"
                                type="file"
                                accept="image/*"
                                onChange={handleFileChange}
                            />
                            {previewUrl && <img src={previewUrl} alt="Preview" className="logo-preview" />}
                        </div>
                    </>
                )}
                {isService && (
                    <>
                        <div className="form-group">
                            <label htmlFor="name">שם שירות</label>
                            <input
                                id="name"
                                name="name"
                                type="text"
                                value={editingItem.name || ''}
                                onChange={handleInputChange}
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="categoryId">קטגוריה</label>
                            <select
                                id="categoryId"
                                name="categoryId"
                                value={editingItem.categoryId || ''}
                                onChange={handleInputChange}
                                required
                            >
                                <option value="">בחר קטגוריה</option>
                                {categories.map(cat => (
                                    <option key={cat._id} value={cat._id}>{cat.name}</option>
                                ))}
                            </select>
                        </div>
                    </>
                )}
                {isUser && (
                     <>
                        <div className="form-group">
                            <label>שם</label>
                            <input type="text" value={`${editingItem.firstName || ''} ${editingItem.lastName || ''}`} readOnly />
                        </div>
                        <div className="form-group">
                            <label>Email</label>
                            <input type="email" value={editingItem.email || ''} readOnly />
                        </div>
                        <div className="form-group">
                            <label htmlFor="role">תפקיד</label>
                            <select
                                id="role"
                                name="role"
                                value={editingItem.role || ''}
                                onChange={handleInputChange}
                            >
                                {Object.entries(roleTranslations).map(([key, value]) => (
                                    <option key={key} value={key}>{value}</option>
                                ))}
                            </select>
                        </div>
                        <div className="form-group">
                            <label htmlFor="active">פעיל</label>
                            <input
                                type="checkbox"
                                id="active"
                                name="active"
                                checked={editingItem.active || false}
                                onChange={e => handleInputChange({ target: { name: 'active', value: e.target.checked } })}
                            />
                        </div>
                     </>
                )}
                <div className="modal-actions">
                    <button type="submit" className="save-button">שמור</button>
                    <button type="button" onClick={() => setIsModalOpen(false)} className="cancel-button">ביטול</button>
                </div>
            </form>
        );
    };

    const renderContent = () => (
        <>
            {activeTab === 'categories' && renderCategoriesTab()}
            {activeTab === 'services' && renderServicesTab()}
            {activeTab === 'users' && renderUsersTab()}
            {activeTab === 'businesses' && renderBusinessesTab()}
        </>
    );

    return (
        <div className="admin-panel">
            <div className="admin-header">
                <h1>ניהול טבלאות בסיס</h1>
                <p>נהל טבלאות המכילות מידע תשתיתי באפליקציה</p>
            </div>
            
            <div className="tabs">
                <button 
                    className={`tab ${activeTab === 'categories' ? 'active' : ''}`}
                    onClick={() => setActiveTab('categories')}
                >
                    <FaTags />
                    קטגוריות
                </button>
                <button 
                    className={`tab ${activeTab === 'services' ? 'active' : ''}`}
                    onClick={() => setActiveTab('services')}
                >
                    <FaCogs />
                    שירותים
                </button>
                <button 
                    className={`tab ${activeTab === 'users' ? 'active' : ''}`}
                    onClick={() => setActiveTab('users')}
                >
                    <FaUsers />
                    משתמשים
                </button>
                <button 
                    className={`tab ${activeTab === 'businesses' ? 'active' : ''}`}
                    onClick={() => setActiveTab('businesses')}
                >
                    <FaBuilding />
                    עסקים
                </button>
            </div>

            <div className="tab-content">
                {isLoading ? <div className="loading-spinner">טוען...</div> : renderContent()}
            </div>

            {isModalOpen && (
                <div className="modal-backdrop">
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>{editingItem?._id ? `ערוך ${getContextName(activeTab)}` : `הוסף ${getContextName(activeTab)}`}</h2>
                            <button onClick={() => setIsModalOpen(false)} className="close-button">&times;</button>
                        </div>
                        <div className="modal-body">
                            {renderForm()}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminPanelPage; 