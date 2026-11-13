import { Route, Routes } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import RequireAdmin from './components/RequireAdmin.jsx';
import Seo from './components/Seo.jsx';
import { NotFoundState } from './components/StateViews.jsx';
import AdminPage from './pages/AdminPage.jsx';
import HotelListPage from './pages/HotelListPage.jsx';
import HotelDetailPage from './pages/HotelDetailPage.jsx';
import HotelFormPage from './pages/HotelFormPage.jsx';
import LoginPage from './pages/LoginPage.jsx';

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        {/* public */}
        <Route index element={<HotelListPage />} />
        <Route path="hotels/:id" element={<HotelDetailPage />} />
        <Route path="login" element={<LoginPage />} />

        {/* admin only */}
        <Route path="admin" element={<RequireAdmin><AdminPage /></RequireAdmin>} />
        <Route path="hotels/new" element={<RequireAdmin><HotelFormPage mode="create" /></RequireAdmin>} />
        <Route path="hotels/:id/edit" element={<RequireAdmin><HotelFormPage mode="edit" /></RequireAdmin>} />

        <Route
          path="*"
          element={
            <>
              <Seo title="Page not found" noIndex />
              <NotFoundState />
            </>
          }
        />
      </Route>
    </Routes>
  );
}
