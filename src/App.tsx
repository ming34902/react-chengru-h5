import { RouterProvider } from 'react-router';

import ToastProvider from '@/components/Toast';

import router from './routes';

const App: React.FC = () => {
    return (
        // ToastProvider：全局 toast 容器（收藏、加购等操作反馈需要它渲染出来）
        <ToastProvider>
            <RouterProvider router={router} />
        </ToastProvider>
    );
};

export default App;
