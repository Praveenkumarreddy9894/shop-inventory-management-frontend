import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/layout/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ProductManagement from './pages/ProductManagement';
import BillingPage from './pages/BillingPage';
import ProductBillingPage from './pages/ProductBillingPage';
import SalesReports from './pages/SalesReports';
import PurchaseEntry from './pages/PurchaseEntry';
import PurchaseBillUpload from './pages/PurchaseBillUpload';

function PrivateRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <div className="container">Loading...</div>;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <Layout>{children}</Layout>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <PrivateRoute>
            <Dashboard />
          </PrivateRoute>
        }
      />
      <Route
        path="/products"
        element={
          <PrivateRoute>
            <ProductManagement />
          </PrivateRoute>
        }
      />
      <Route
        path="/billing"
        element={
          <PrivateRoute>
            <BillingPage />
          </PrivateRoute>
        }
      />
      <Route
        path="/product-billing"
        element={
          <PrivateRoute>
            <ProductBillingPage />
          </PrivateRoute>
        }
      />
      <Route
        path="/sales"
        element={
          <PrivateRoute>
            <SalesReports />
          </PrivateRoute>
        }
      />
      <Route
        path="/purchases"
        element={
          <PrivateRoute>
            <PurchaseEntry />
          </PrivateRoute>
        }
      />
      <Route
        path="/purchases/upload"
        element={
          <PrivateRoute>
            <PurchaseBillUpload />
          </PrivateRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
