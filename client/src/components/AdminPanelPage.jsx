import React, { useState, useEffect } from 'react';
import { FaTags, FaCogs, FaUsers } from 'react-icons/fa';
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
    const [isLoading, setIsLoading] = useState(true);
    const [selectedFile, setSelectedFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState('');

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
            <button className="add-button" onClick={() => {
                setEditingItem({ role: 'end-user' });
                setIsModalOpen(true);
            }}>
                + הוסף משתמש חדש
            </button>
            <table className="admin-table">
                <thead>
                    <tr>
                        <th>שם מלא</th>
                        <th>אימייל</th>
                        <th>תפקיד</th>
                        <th>פעולות</th>
                    </tr>
                </thead>
                <tbody>
                    {users.map(user => (
                        <tr key={user._id}>
                            <td>{`${user.firstName || ''} ${user.lastName || ''}`}</td>
                            <td>{user.email}</td>
                            <td>{roleTranslations[user.role] || user.role}</td>
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
        switch (activeTab) {
            case 'categories':
                return (
                    <form className="admin-form">
                        <div className="form-group">
                            <label htmlFor="name">שם הקטגוריה</label>
                            <input
                                type="text"
                                id="name"
                                name="name"
                                value={editingItem?.name || ''}
                                onChange={handleInputChange}
                                placeholder="הכנס שם קטגוריה"
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="logo">לוגו</label>
                            <div className="logo-upload">
                                {previewUrl && (
                                    <img 
                                        src={previewUrl} 
                                        alt="תצוגה מקדימה"
                                        className="logo-preview"
                                    />
                                )}
                                <input
                                    type="file"
                                    id="logo"
                                    name="logo"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                />
                            </div>
                        </div>
                    </form>
                );

            case 'services':
                return (
                    <form className="admin-form">
                        <div className="form-group">
                            <label htmlFor="name">שם השירות</label>
                            <input
                                type="text"
                                id="name"
                                name="name"
                                value={editingItem?.name || ''}
                                onChange={handleInputChange}
                                placeholder="הכנס שם שירות"
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="categoryId">קטגוריה</label>
                            <select
                                id="categoryId"
                                name="categoryId"
                                value={editingItem?.categoryId || ''}
                                onChange={handleInputChange}
                            >
                                <option value="">בחר קטגוריה</option>
                                {categories.map(category => (
                                    <option key={category._id} value={category._id}>
                                        {category.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </form>
                );

            case 'users':
                return (
                    <form className="admin-form">
                        <div className="form-group">
                            <label htmlFor="firstName">שם פרטי</label>
                            <input
                                type="text"
                                id="firstName"
                                name="firstName"
                                value={editingItem?.firstName || ''}
                                onChange={handleInputChange}
                                placeholder="הכנס שם פרטי"
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="lastName">שם משפחה</label>
                            <input
                                type="text"
                                id="lastName"
                                name="lastName"
                                value={editingItem?.lastName || ''}
                                onChange={handleInputChange}
                                placeholder="הכנס שם משפחה"
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="email">אימייל</label>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                value={editingItem?.email || ''}
                                onChange={handleInputChange}
                                placeholder="הכנס כתובת אימייל"
                                required
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="password">סיסמה (אם רוצים לשנות)</label>
                            <input
                                type="password"
                                id="password"
                                name="password"
                                value={editingItem?.password || ''}
                                onChange={handleInputChange}
                                placeholder={editingItem?._id ? "השאר ריק כדי לא לשנות" : "הכנס סיסמה"}
                                required={!editingItem?._id}
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="role">תפקיד</label>
                            <select
                                id="role"
                                name="role"
                                value={editingItem?.role || 'end-user'}
                                onChange={handleInputChange}
                            >
                                <option value="end-user">משתמש</option>
                                <option value="manager">מנהל מערכת</option>
                                <option value="admin">מנהל</option>
                            </select>
                        </div>
                    </form>
                );

            default:
                return null;
        }
    };

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
            </div>

            <div className="tab-content">
                {isLoading ? <div className="loading-spinner">טוען...</div> : (
                    <>
                        {activeTab === 'categories' && renderCategoriesTab()}
                        {activeTab === 'services' && renderServicesTab()}
                        {activeTab === 'users' && renderUsersTab()}
                    </>
                )}
            </div>

            {isModalOpen && (
                <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>{`${editingItem?._id ? 'עריכת' : 'הוספת'} ${getContextName(activeTab)}`}</h2>
                            <button className="close-button" onClick={() => {
                                setIsModalOpen(false);
                                setEditingItem(null);
                                setSelectedFile(null);
                                setPreviewUrl('');
                            }}>✕</button>
                        </div>
                        {renderForm()}
                        <div className="modal-actions">
                            <button className="save-button" onClick={handleSave}>
                                {editingItem?._id ? 'שמור שינויים' : `הוסף ${getContextName(activeTab)}`}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminPanelPage; 