import { connectDB } from "@/lib/db";
import Post from "@/models/post";
import { authenticate } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { createPostSchema } from "@/lib/validations/post";
import { paginationSchema } from "@/lib/validations/pagination";
import { handleError } from "@/lib/errorHandler";
import { uploadToCloudinary } from "@/lib/cloudinary";

// creating a post with image upload
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const result = authenticate(request);

    if (result instanceof NextResponse) {
      return result;
    }

    const payload = result;

    const formData = await request.formData();

    const rawTitle = formData.get("title");
    const rawContent = formData.get("content");
    const rawImage = formData.get("image");

    const validation = createPostSchema.safeParse({
      title: rawTitle,
      content: rawContent,
      image: rawImage,
    });

    if (!validation.success) {
      return handleError(validation.error);
    }

    const { title, content, image } = validation.data;

    if (!(image instanceof File)) {
      return NextResponse.json(
        { message: "Image is required" },
        { status: 400 },
      );
    }

    const arrayBuffer = await image.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const finalResult = await uploadToCloudinary(buffer);
    console.log("🚀 ~ finalResult:", finalResult);

    const post = await Post.create({
      title,
      content,
      imageUrl: finalResult.secure_url,
      imagePublicId: finalResult.public_id,
      author: payload.id,
    });

    return NextResponse.json(
      {
        message: "Post created successfully",
        post,
      },
      {
        status: 201,
      },
    );
  } catch (error) {
    return handleError(error);
  }
}

// GET all posts
export async function GET(request: NextRequest) {
  console.log("📥 [GET] /api/posts request received");
  const searchParams = request.nextUrl.searchParams;

  const validation = paginationSchema.safeParse({
    page: searchParams.get("page") ?? undefined,
    limit: searchParams.get("limit") ?? undefined,
  });

  if (!validation.success) {
    return handleError(validation.error);
  }

  const { page, limit } = validation.data;

  const skip = (page - 1) * limit;

  try {
    await connectDB();

    const posts = await Post.find()
      .populate("author")
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip);

    const totalPosts = await Post.countDocuments();
    const totalPages = Math.ceil(totalPosts / limit);

    return NextResponse.json({
      posts,
      pagination: {
        page,
        limit,
        totalPosts,
        totalPages,
      },
    });
  } catch (error) {
    console.error(error);
    return handleError(error);
  }
}
