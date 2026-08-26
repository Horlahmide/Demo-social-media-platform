import { connectDB } from "@/lib/db";
import { authenticate } from "@/lib/auth";
import Comment from "@/models/comment";
import Post from "@/models/post";
import { NextRequest, NextResponse } from "next/server";
import { updateCommentSchema } from "@/lib/validations/comment";

// GET single comment by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  console.log("📥 [GET] /api/comments/[id] request received");
  try {
    await connectDB();
    const { id } = await params;

    const comment = await Comment.findById(id)
      .populate("author", "username email profileImage")
      .populate("post", "title");

    if (!comment) {
      return NextResponse.json(
        { message: "Comment not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(comment, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
}

// PUT update comment by ID
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  console.log("📥 [PUT] /api/comments/[id] request received");
  try {
    await connectDB();

    const payload = authenticate(request);
    if (payload instanceof NextResponse) {
      return payload;
    }

    const { id } = await params;
    const body = await request.json();
    const validation = await updateCommentSchema.safeParse(body);

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

    const comment = await Comment.findById(id);
    if (!comment) {
      return NextResponse.json(
        { message: "Comment not found" },
        { status: 404 },
      );
    }

    if (comment.author.toString() !== payload.id) {
      return NextResponse.json(
        { message: "Unauthorized to update this comment" },
        { status: 403 },
      );
    }

    comment.content = content;
    await comment.save();

    return NextResponse.json(
      { message: "Comment updated successfully", comment },
      { status: 200 },
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
}

// DELETE comment by ID
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  console.log("📥 [DELETE] /api/comments/[id] request received");
  try {
    await connectDB();

    const payload = authenticate(request);
    if (payload instanceof NextResponse) {
      return payload;
    }

    const { id } = await params;

    const comment = await Comment.findById(id);
    if (!comment) {
      return NextResponse.json(
        { message: "Comment not found" },
        { status: 404 },
      );
    }

    if (comment.author.toString() !== payload.id) {
      return NextResponse.json(
        { message: "Unauthorized to delete this comment" },
        { status: 403 },
      );
    }

    await comment.deleteOne();

    // Decrement commentsCount on the Post
    await Post.findByIdAndUpdate(comment.post, {
      $inc: { commentsCount: -1 },
    });

    return NextResponse.json(
      { message: "Comment deleted successfully" },
      { status: 200 },
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
}
