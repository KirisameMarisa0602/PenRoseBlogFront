import React, { useEffect } from 'react';
import Maid from '../components/home/maid/Maid';
import '../styles/home/Home.css';
import BannerNavbar from '../components/common/BannerNavbar';


const Home = () => {


  useEffect(() => {
  }, []);

  return (
    <>
      <BannerNavbar bannerId={undefined} />
      <Maid />
    </>
  );
};

export default Home;