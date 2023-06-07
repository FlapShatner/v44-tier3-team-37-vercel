import Head from "next/head";
import prisma from "@/lib/prisma";
import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { NextApiRequest, NextApiResponse } from "next";
import type { NextAuthOptions, Session } from "next-auth";
import { getServerSession } from "next-auth";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import SearchBar from "@/components/Search/SearchBar";

import s from "@/styles/Home.module.css";

export type Image = {
  id: string;
  uploaded_at: string;
  title: string;
  location: string;
  description: string;
  date: string;
  alt: string;
  url: string;
  tagIds: string;
  organizationId: string;
  userId: string;
};

export type TagWithImages = {
  id: string;
  name: string;
  images: Image[];
};

interface ImagesProps {
  allImages: Image[];
  organizationImages?: Image[];
  userImages: Image[];
  tagsWithImages: TagWithImages[];
  orgId: string;
}

const Home: React.FC<ImagesProps> = ({
  allImages,
  organizationImages,
  userImages,
  tagsWithImages,
  orgId,
}) => {
  const router = useRouter();
  const { data: session } = useSession();
  let imageAlreadySaved: {} | undefined;
  const [favoriteImages, setFavoriteImages] = useState<string[]>(
    userImages ? userImages?.map((image) => image.id) : []
  );
  const [selectedTags, setSelectedTags] = useState<TagWithImages[]>([]);
  const [initialImages, setInitialImages] = useState<Image[]>([]);
  const [displayedImages, setDisplayedImages] =
    useState<Image[]>(initialImages);

  useEffect(() => {
    if (session?.user.role === "ORG") {
      setInitialImages(organizationImages || []);
      setDisplayedImages(organizationImages || []);
    } else {
      setInitialImages(allImages);
      setDisplayedImages(allImages);
    }
  }, [session?.user.role]);

  const filterImages = (selectedTags: TagWithImages[]) => {
    return selectedTags.map((tag) => tag.images).flat(Infinity) as Image[];
  };

  const removeDuplicates = (images: Image[]) => {
    return images.reduce((acc, current) => {
      const x = acc.find((item) => item.id === current.id);
      if (!x) {
        return acc.concat([current]);
      } else {
        return acc;
      }
    }, [] as Image[]);
  };

  const filterOrganizationImages = (images: Image[]) => {
    return images.filter((image) => image.organizationId === orgId);
  };

  useEffect(() => {
    if (selectedTags.length > 0) {
      const filteredImages = filterImages(selectedTags);
      const uniqueImages = removeDuplicates(filteredImages);
      const results =
        session?.user.role === "ORG"
          ? filterOrganizationImages(uniqueImages)
          : uniqueImages;
      setDisplayedImages(results);
      console.log(uniqueImages);
      console.log(orgId);
    } else {
      setDisplayedImages(initialImages);
    }
  }, [selectedTags, session?.user.role]);

  // if user role is NONE, route to onboarding form
  if (session?.user?.role == "NONE") {
    router.push("/auth/new-user");
  }

  const updateUserCollection = async (imageId: string) => {
    imageAlreadySaved = favoriteImages.includes(imageId);

    // update favoriteImages array
    imageAlreadySaved
      ? setFavoriteImages((cur) => cur.filter((id) => id !== imageId))
      : setFavoriteImages((cur) => [...cur, imageId]);

    try {
      const body = { imageId, imageAlreadySaved };

      const response = await fetch(`/api/saveImage/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });
    } catch (error) {
      console.error("Error saving/unsaving image", error);
    }
  };

  const favorited = (imageId: string) => {
    return !!favoriteImages.find((id) => id === imageId);
  };

  const routeToImageDetails = (imageId: string) => {
    router.push(`/image/${imageId}`);
  };

  const searchBarProps = {
    initialImages,
    displayedImages,
    setDisplayedImages,
    tagsWithImages,
    selectedTags,
    setSelectedTags,
  };
  if (session === undefined) return <div>loading...</div>;

  return (
    <>
      <Head>
        <title>Create Next App</title>
        <meta name="description" content="Generated by create next app" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className={s.main}>
        {session && <SearchBar {...searchBarProps} />}
        <h1>Home</h1>
        {session !== null && <p>You are signed in as a {session.user.role}</p>}
        {session?.user.role === "ORG" && (
          <div className={s.collectionOuterContainer}>
            {displayedImages?.map((image) => (
              <div className={s.imageContainer} key={image.id}>
                <img src={image.url} className={s.image} alt={image.alt} />
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className={s.favoriteIcon}
                  width="23"
                  height="23"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#6eadf4"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polygon points="16 3 21 8 8 21 3 21 3 16 16 3"></polygon>
                </svg>
              </div>
            ))}
          </div>
        )}
        {session?.user.role === "USER" && (
          <div className={s.collectionOuterContainer}>
            {displayedImages.map((image) => (
              <div className={s.imageContainer} key={image.id}>
                <img
                  onClick={() => routeToImageDetails(image.id)}
                  src={image.url}
                  className={s.image}
                  alt={image.alt}
                />
                {favorited(image.id) ? (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    onClick={() => updateUserCollection(image.id)}
                    className={s.favoriteIcon}
                    width="23"
                    height="23"
                    viewBox="0 0 24 24"
                    fill="#6eadf4"
                    stroke="#6eadf4"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                  </svg>
                ) : (
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    onClick={() => updateUserCollection(image.id)}
                    className={s.favoriteIcon}
                    width="23"
                    height="23"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#6eadf4"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                  </svg>
                )}
              </div>
            ))}
          </div>
        )}
        {!session?.user.role && (
          <div className={s.collectionOuterContainer}>
            {allImages.map((image) => (
              <div className={s.imageContainer} key={image.id}>
                <img src={image.url} className={s.image} alt={image.alt} />
              </div>
            ))}
          </div>
        )}
      </main>
    </>
  );
};

export async function getServerSideProps(context: {
  req: NextApiRequest;
  res: NextApiResponse;
  authOptions: NextAuthOptions;
}) {
  const session: Session | null = await getServerSession(
    context.req,
    context.res,
    authOptions
  );

  const tagsWithImages = await prisma.tag.findMany({
    include: {
      images: true,
    },
  });

  let allImages = await prisma.image.findMany();
  let organizationImages = null;
  let userImages = null;
  let orgId = null;

  if (session && session.user.role === "ORG") {
    const org = await prisma.organization.findFirst({
      where: {
        user: {
          id: session.user.id,
        },
      },
    });
    orgId = org?.id;
  }

  if (session && session.user.role === "ORG") {
    const org = await prisma.organization.findFirst({
      where: {
        user: {
          id: session.user.id,
        },
      },
      include: {
        images: true,
      },
    });
    organizationImages = org?.images;
  }

  if (session && session.user.role === "USER") {
    const user = await prisma.user.findFirst({
      where: {
        id: session.user.id,
      },
      include: {
        images: true,
      },
    });
    userImages = user?.images;
  }

  return {
    props: {
      allImages,
      organizationImages,
      userImages,
      tagsWithImages,
      orgId,
    },
  };
}

export default Home;
