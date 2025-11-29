import React, { Suspense, lazy } from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
const Welcome = lazy(() => import('./pages/Welcome'));
const Home = lazy(() => import('./pages/Home'));
const SelfSpace = lazy(() => import('./pages/SelfSpace'));
const BlogEditor = lazy(() => import('./pages/BlogEditor'));
const ArticleDetail = lazy(() => import('./pages/ArticleDetail'));
const MessageList = lazy(() => import('./pages/MessageList'));
const ConversationDetail = lazy(() => import('./pages/ConversationDetail'));
const UserSearch = lazy(() => import('./pages/UserSearch'));
const PendingFriendRequests = lazy(() => import('./pages/PendingFriendRequests'));
const FriendsList = lazy(() => import('./pages/FriendsList'));
const FollowingList = lazy(() => import('./pages/FollowingList'));

ReactDOM.createRoot(document.getElementById('root')).render(
	<React.StrictMode>
		<BrowserRouter>
			<Suspense fallback={null}>
				   <Routes>
					   <Route path="/" element={<Home />} />
					   <Route path="/home" element={<Home />} />
					   <Route path="/welcome" element={<Welcome />} />
					   <Route path="/selfspace" element={<SelfSpace />} />
					   <Route path="/blog-edit" element={<BlogEditor />} />
					   <Route path="/post/:id" element={<ArticleDetail />} />
					   <Route path="/messages" element={<MessageList />} />
					   <Route path="/conversation/:otherId" element={<ConversationDetail />} />
					   <Route path="/friends/pending" element={<PendingFriendRequests />} />
					   <Route path="/friends" element={<FriendsList />} />
					   <Route path="/follows" element={<FollowingList />} />
			    	   <Route path="/users/search" element={<UserSearch />} />
				   </Routes>
			</Suspense>
		</BrowserRouter>
	</React.StrictMode>
);
