import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { authenticate } from "@/lib/auth";
import Post from "@/models/post";
import Like from "@/models/likes";
import { NextRequest, NextResponse } from "next/server";
import { handleError } from "@/lib/errorHandler";

// Likes a post
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

    if (post.author.toString() === payload.id) {
      return NextResponse.json(
        {
          message: "You cannot like your own post",
        },
        {
          status: 400,
        },
      );
    }

    if (await Like.exists({ user: payload.id, post: id })) {
      return NextResponse.json(
        {
          message: "You have already liked this post",
        },
        {
          status: 409,
        },
      );
    }

    const session = await mongoose.startSession();
    try {
      session.startTransaction();
      const like = await Like.create(
        [
          {
            user: payload.id,
            post: id,
          },
        ],
        { session },
      );

      post.likesCount++;
      await post.save({ session });

      await session.commitTransaction();

      return NextResponse.json(
        {
          message: "Post liked successfully",
          like,
        },
        {
          status: 201,
        },
      );
    } catch (error) {
      await session.abortTransaction();
      return handleError(error);
    } finally {
      await session.endSession();
    }
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

// Unlikes a post
export async function DELETE(
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

    const like = await Like.findOne({ user: payload.id, post: id });

    if (!like) {
      return NextResponse.json(
        {
          message: "You have not liked this post",
        },
        {
          status: 404,
        },
      );
    }

    await like.deleteOne();

    post.likesCount--;
    await post.save();

    return NextResponse.json(
      {
        message: "Post unliked successfully",
      },
      {
        status: 200,
      },
    );
  } catch (error) {
    console.error(error);
    return handleError(error);
  }
}

// GETs all likes for a post
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

    const likes = await Like.find({ post: id }).populate(
      "user",
      "username email",
    );

    return NextResponse.json(likes, {
      status: 200,
    });
  } catch (error) {
    console.error(error);
    return handleError(error);
  }
}
