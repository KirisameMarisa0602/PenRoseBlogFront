import React, { Suspense, lazy } from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';



import { BrowserRouter, Routes, Route } from 'react-router-dom';
const Welcome = lazy(() => import('./pages/Welcome'));
const Home = lazy(() => import('./pages/Home'));
const SelfSpace = lazy(() => import('./pages/SelfSpace'));



ReactDOM.createRoot(document.getElementById('root')).render(
	<React.StrictMode>
		<BrowserRouter>
			<Suspense fallback={null}>
				   <Routes>
					   <Route path="/" element={<Home />} />
					   <Route path="/home" element={<Home />} />
					   <Route path="/welcome" element={<Welcome />} />
					   <Route path="/selfspace" element={<SelfSpace />} />
				   </Routes>
			</Suspense>
		</BrowserRouter>
	</React.StrictMode>
);
