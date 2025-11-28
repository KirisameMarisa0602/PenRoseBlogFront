import React, { Suspense, lazy } from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';


import { BrowserRouter, Routes, Route } from 'react-router-dom';
const Welcome = lazy(() => import('./pages/Welcome'));
const Home = lazy(() => import('./pages/Home'));
const SelfSpace = lazy(() => import('./pages/SelfSpace'));
const BlogEditPage = lazy(() => import('./pages/BlogEditPage'));
const ArticleDetailPage = lazy(() => import('./pages/ArticleDetailPage'));
const FriendSearchPage = lazy(() => import('./pages/FriendSearchPage'));
const FriendListPage = lazy(() => import('./pages/FriendListPage'));
const ChatPage = lazy(() => import('./pages/ChatPage'));
const ApiTestPage = lazy(() => import('./pages/ApiTestPage'));


ReactDOM.createRoot(document.getElementById('root')).render(
	<React.StrictMode>
		<BrowserRouter>
			<Suspense fallback={null}>
				   <Routes>
					   <Route path="/" element={<Home />} />
					   <Route path="/home" element={<Home />} />
					   <Route path="/welcome" element={<Welcome />} />
					   <Route path="/selfspace" element={<SelfSpace />} />
					   <Route path="/edit-blog" element={<BlogEditPage />} />
					   <Route path="/article/:id" element={<ArticleDetailPage />} />
					   <Route path="/friend-search" element={<FriendSearchPage />} />
					   <Route path="/friend-list" element={<FriendListPage />} />
					   <Route path="/chat" element={<ChatPage />} />
					   <Route path="/api-test" element={<ApiTestPage />} />

				   </Routes>
			</Suspense>
		</BrowserRouter>
	</React.StrictMode>
);
