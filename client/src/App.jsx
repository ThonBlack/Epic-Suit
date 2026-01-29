import { HashRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './features/dashboard/DashboardPage';
import Accounts from './features/accounts/AccountsPage';
import NewStatus from './features/scheduler/NewStatusPage';
import Scheduled from './features/scheduler/ScheduledPage';
import Settings from './pages/Settings'; // Mantido em pages por enquanto ou mover para shared/features? O plano não especificou.
import Calendar from './features/scheduler/CalendarPage';
import AutoReply from './features/autoreply/AutoReplyPage';
import CampaignList from './features/campaigns/CampaignListPage';
import CampaignCreate from './features/campaigns/CampaignCreatePage';
import CampaignDetails from './features/campaigns/CampaignDetailsPage';
import './index.css';

function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="accounts" element={<Accounts />} />
          <Route path="new-status" element={<NewStatus />} />
          <Route path="scheduled" element={<Scheduled />} />
          <Route path="calendar" element={<Calendar />} />
          <Route path="autoreply" element={<AutoReply />} />
          <Route path="campaigns" element={<CampaignList />} />
          <Route path="campaigns/new" element={<CampaignCreate />} />
          <Route path="campaigns/:id" element={<CampaignDetails />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}

export default App;
