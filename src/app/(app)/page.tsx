import "@/app/globals.css";
import * as React from "react";

import { Card, CardContent } from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import Link from "next/link";

const Home = () => {
  type CarouselContentType = {
    id: number;
    content: string;
  };
  const CarouselContentArray: CarouselContentType[] = [
    {
      id: 1,
      content: "Get your first mystery feedback",
    },

    {
      id: 2,
      content: "Get Image,Videos and text from an anonymous",
    },
    {
      id: 3,
      content: "Let you know what people think about you !!",
    },
  ];
  return (
    <div className=" flex flex-col justify-evenly items-center h-[calc(100vh-6rem)] max-w-full w-full overflow-x-hidden">
      <div>
        <h2 className="text-center  min-[371px]:text-lg sm:text-2xl md:text-4xl my-3 font-bold">
          Welcome to the world of Mystery message
        </h2>
        <h5 className="text-center min-[371px]:text-lg sm:text-2xl  md:text-3xl my-5 font-bold">
          Get your first anonymous message now !!
        </h5>
        <Carousel className="max-w-full w-full mx-auto flex flex-col justify-center items-center">
          <CarouselContent>
            {CarouselContentArray.map((carouselContent) => (
              <CarouselItem
                key={carouselContent.id}
                className="h-[200px] sm:h-[250px]"
              >
                <div className="h-full w-full">
                  <Card className="h-full w-full flex items-center justify-center">
                    <CardContent className="flex h-full w-full items-center justify-center sm:p-24 p-5">
                      <span className="sm:text-3xl text-xl font-semibold text-center">
                        {carouselContent.content}
                      </span>
                    </CardContent>
                  </Card>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
      </div>

      <footer className="w-screen max-w-screen mx-auto p-4 md:py-2">
        <hr className="my-5 border-gray-200 sm:mx-auto dark:border-gray-700 lg:my-4" />
        <span className="block text-sm text-gray-500 text-center">
          © {new Date().getFullYear()}{" "}
          <Link
            href="http://bharatesh-portfolio.vercel.app/"
            className="hover:underline"
          >
            Bharatesh Poojary
          </Link>
          . All Rights Reserved.
        </span>
      </footer>
    </div>
  );
};

export default Home;
