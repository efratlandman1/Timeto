import React, { useState, useEffect } from 'react';
import { FaTags, FaCogs, FaUsers } from 'react-icons/fa';
import axios from 'axios';
import '../styles/AdminPanelPage.css';
import { toast } from 'react-toastify';

const AdminPanelPage = () => {
    const [activeTab, setActiveTab] = useState('categories');
    const [editingItem, setEditingItem] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [categories, setCategories] = useState([]);
    const [services, setServices] = useState([]);
    const [users, setUsers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedFile, setSelectedFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState('');

    useEffect(() => {
        fetchData();
    }, [activeTab]);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            switch (activeTab) {
                case 'categories':
                    const categoriesResponse = await axios.get(`${process.env.REACT_APP_API_DOMAIN}/api/v1/categories`);
                    setCategories(categoriesResponse.data);
                    break;
                case 'services':
                    const [servicesRes, categoriesRes] = await Promise.all([
                        axios.get(`${process.env.REACT_APP_API_DOMAIN}/api/v1/services/`)//,
                        // axios.get(`${process.env.REACT_APP_API_DOMAIN}/api/v1/categories`)
                    ]);
                    setServices(servicesRes.data);
                    setCategories(categoriesRes.data);
                    break;
                case 'users':
                    const usersResponse = await axios.get(`${process.env.REACT_APP_API_DOMAIN}/api/v1/users`);
                    setUsers(usersResponse.data);
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
                setEditingItem(prev => ({
                    ...prev,
                    logo: file
                }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleEdit = async (item) => {
        setEditingItem(item);
        setPreviewUrl(item.logo || '');
        setIsModalOpen(true);
    };

    const handleDelete = async (id) => {
        const confirmResult = await toast.promise(
            new Promise((resolve) => {
                const toastId = toast.info(
                    <div className="delete-confirmation">
                        <p>האם אתה בטוח שברצונך למחוק פריט זה?</p>
                        <div className="confirmation-buttons">
                            <button onClick={() => {
                                toast.dismiss(toastId);
                                resolve(true);
                            }}>כן, מחק</button>
                            <button onClick={() => {
                                toast.dismiss(toastId);
                                resolve(false);
                            }}>ביטול</button>
                        </div>
                    </div>,
                    { autoClose: false, closeButton: false }
                );
            }),
            {
                pending: 'ממתין לאישור...',
                success: 'הפריט נמחק בהצלחה',
                error: 'שגיאה במחיקת הפריט'
            }
        );

        if (!confirmResult) return;

        try {
            switch (activeTab) {
                case 'categories':
                    await axios.delete(`${process.env.REACT_APP_API_DOMAIN}/api/v1/categories/${id}`);
                    break;
                case 'services':
                    await axios.delete(`${process.env.REACT_APP_API_DOMAIN}/api/v1/services/${id}`);
                    break;
                case 'users':
                    await axios.delete(`${process.env.REACT_APP_API_DOMAIN}/api/v1/users/${id}`);
                    break;
            }
            fetchData();
        } catch (error) {
            console.error('Error deleting item:', error);
            toast.error('שגיאה במחיקת הפריט');
        }
    };

    const handleSave = async () => {
        try {
            const formData = new FormData();
            Object.keys(editingItem).forEach(key => {
                if (key === 'logo' && editingItem[key] instanceof File) {
                    formData.append('logo', editingItem[key]);
                } else if (key !== 'logo') {
                    formData.append(key, editingItem[key]);
                }
            });

            const endpoint = `${process.env.REACT_APP_API_DOMAIN}/api/v1/${activeTab}`;
            if (editingItem._id) {
                await axios.put(`${endpoint}/${editingItem._id}`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                toast.success('הפריט עודכן בהצלחה');
            } else {
                await axios.post(endpoint, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                toast.success('הפריט נוסף בהצלחה');
            }
            setIsModalOpen(false);
            setEditingItem(null);
            setSelectedFile(null);
            setPreviewUrl('');
            fetchData();
        } catch (error) {
            console.error('Error saving item:', error);
            toast.error('שגיאה בשמירת הפריט');
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setEditingItem(prev => ({
            ...prev,
            [name]: value
        }));
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
                                    src={category.logo || '/placeholder-logo.png'} 
                                    alt={category.name}
                                    className="category-logo"
                                />
                            </td>
                            <td>{category.name}</td>
                            <td className="actions-cell">
                                <button onClick={() => handleEdit(category)} className="edit-button">
                                    ✏️
                                </button>
                                <button onClick={() => handleDelete(category._id)} className="delete-button">
                                    🗑️
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );

    const renderServicesTab = () => (
        <div className="admin-table-container">
            <button className="add-button" onClick={() => {
                setEditingItem({});
                setIsModalOpen(true);
            }}>
                + הוסף שירות חדש
            </button>
            <table className="admin-table">
                <thead>
                    <tr>
                        <th>שם</th>
                        <th>קטגוריה</th>
                        <th>פעולות</th>
                    </tr>
                </thead>
                <tbody>
                    {services.map(service => {
                        const category = categories.find(c => c._id === service.categoryId);
                        return (
                            <tr key={service._id}>
                                <td>{service.name}</td>
                                <td>{category?.name || 'לא מוגדר'}</td>
                                <td className="actions-cell">
                                    <button onClick={() => handleEdit(service)} className="edit-button">
                                        ✏️
                                    </button>
                                    <button onClick={() => handleDelete(service._id)} className="delete-button">
                                        🗑️
                                    </button>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );

    const renderUsersTab = () => (
        <div className="admin-table-container">
            <button className="add-button" onClick={() => {
                setEditingItem({});
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
                            <td>{`${user.firstName} ${user.lastName}`}</td>
                            <td>{user.email}</td>
                            <td>{user.role === 'admin' ? 'מנהל' : 'משתמש רגיל'}</td>
                            <td className="actions-cell">
                                <button onClick={() => handleEdit(user)} className="edit-button">
                                    ✏️
                                </button>
                                <button onClick={() => handleDelete(user._id)} className="delete-button">
                                    🗑️
                                </button>
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
                            />
                        </div>
                        <div className="form-group">
                            <label htmlFor="role">תפקיד</label>
                            <select
                                id="role"
                                name="role"
                                value={editingItem?.role || 'user'}
                                onChange={handleInputChange}
                            >
                                <option value="user">משתמש רגיל</option>
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
                {isLoading ? (
                    <div className="loading-spinner">טוען...</div>
                ) : (
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
                            <h2>{editingItem?._id ? 'עריכת פריט' : 'הוספת פריט חדש'}</h2>
                            <button 
                                className="close-button" 
                                onClick={() => {
                                    setIsModalOpen(false);
                                    setEditingItem(null);
                                    setSelectedFile(null);
                                    setPreviewUrl('');
                                }}
                            >
                                ✕
                            </button>
                        </div>
                        {renderForm()}
                        <div className="modal-actions">
                            <button className="cancel-button" onClick={() => {
                                setIsModalOpen(false);
                                setEditingItem(null);
                                setSelectedFile(null);
                                setPreviewUrl('');
                            }}>
                                ביטול
                            </button>
                            <button className="save-button" onClick={handleSave}>
                                שמור שינויים
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminPanelPage; 