import { Route, Routes } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import TaskFormPage from './pages/TaskFormPage.jsx';
import TaskDetailsPage from './pages/TaskDetailsPage.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx';

// URL map of the app. Every page renders inside <Layout> (sidebar + content).
export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<DashboardPage />} />
        <Route path="tasks/new" element={<TaskFormPage />} />
        <Route path="tasks/:id" element={<TaskDetailsPage />} />
        <Route path="tasks/:id/edit" element={<TaskFormPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}
