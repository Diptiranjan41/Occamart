import React from "react";
import HeroBanner from "../components/home/HeroBanner";
import Categories from "../components/home/Categories";
import TrendingProducts from "../components/home/TrendingProducts";
import DealsSection from "../components/home/DealsSection";
import FeaturedProducts from "../components/home/FeaturedProducts";
import Reviews from "../components/home/Reviews";
import Newsletter from "../components/home/Newsletter";

const Home = () => {
  return (
    <>
      <HeroBanner />
      <Categories />
      <TrendingProducts />
      <DealsSection />
      <FeaturedProducts />
      <Reviews />
      <Newsletter />
    </>
  );
};

export default Home;