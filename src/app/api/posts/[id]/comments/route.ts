import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Post from "@/models/post";
import Comment from "@/models/comment";
import { authenticate } from "@/lib/auth";
import { createCommentSchema } from "@/lib/validations/comment";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await connectDB();

    const payload = authenticate(request);

    if (payload instanceof NextResponse) {
      return payload;
    }

    const { id } = await params;

    const post = await Post.findById(id);

    if (!post) {
      return NextResponse.json(
        {
          message: "Post not found",
        },
        {
          status: 404,
        },
      );
    }

    const body = await request.json();
    const validation = await createCommentSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          message: "Invalid comment data",
          errors: validation.error.flatten().fieldErrors,
        },
        {
          status: 400,
        },
      );
    }

    const { content } = validation.data;

    const comment = await Comment.create({
      content,
      author: payload.id,
      post: id,
    });

    post.commentsCount++;

    await post.save();

    return NextResponse.json(
      {
        message: "Comment added successfully",
        comment,
      },
      {
        status: 201,
      },
    );
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        message: "Internal server error",
      },
      {
        status: 500,
      },
    );
  }
}

// Get all comments for a specific post
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await connectDB();

    const { id } = await params;

    const post = await Post.findById(id);

    if (!post) {
      return NextResponse.json(
        {
          message: "Post not found",
        },
        {
          status: 404,
        },
      );
    }

    const comments = await Comment.find({ post: id })
      .populate("author")
      .sort({ createdAt: -1 });

    return NextResponse.json(comments);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      {
        message: "Internal server error",
      },
      {
        status: 500,
      },
    );
  }
}
