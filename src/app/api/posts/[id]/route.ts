import mongoose from "mongoose";
import { connectDB } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { authenticate } from "@/lib/auth";
import Post from "@/models/post";
import { updatePostSchema } from "@/lib/validations/post";
import { deleteFromCloudinary } from "@/lib/cloudinary";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { handleError } from "@/lib/errorHandler";

// GET single post by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await connectDB();

    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        {
          message: "Invalid post ID",
        },
        {
          status: 400,
        },
      );
    }

    const post = await Post.findById(id).populate("author", "-password");

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

    return NextResponse.json(
      {
        post,
      },
      {
        status: 200,
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

// Update a post
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await connectDB();

    const payload = authenticate(request);

    // Type guard: if authenticate returned an error response, send it back
    if (payload instanceof NextResponse) {
      return payload;
    }

    // TypeScript now knows payload is JwtUserPayload
    const userId = payload.id;
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        {
          message: "Invalid post ID",
        },
        {
          status: 400,
        },
      );
    }
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
    if (post.author.toString() !== userId) {
      return NextResponse.json(
        {
          message: "Unauthorized to update this post",
        },
        {
          status: 403,
        },
      );
    }
    const body = await request.formData();

    const prevTitle = body.get("title") ?? undefined;
    const prevContent = body.get("content") ?? undefined;
    const prevImage = body.get("image") ?? undefined;

    const validation = await updatePostSchema.safeParse({
      title: prevTitle,
      content: prevContent,
      image: prevImage,
    });

    if (!validation.success) {
      return NextResponse.json(
        {
          message: "Invalid post data",
          errors: validation.error.flatten().fieldErrors,
        },
        {
          status: 400,
        },
      );
    }

    const { title, content, image } = validation.data;

    if (title !== undefined) {
      post.title = title;
    }

    if (content !== undefined) {
      post.content = content;
    }

    if (image !== undefined) {
      if (!(image instanceof File)) {
        return NextResponse.json(
          { message: "Invalid image data" },
          { status: 400 },
        );
      }

      // Store old public ID before overwriting with the new one
      const oldPublicId = post.imagePublicId;

      const arrayBuffer = await image.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const result = await uploadToCloudinary(buffer);

      try {
        post.imagePublicId = result.public_id;
        post.imageUrl = result.secure_url;

        await post.save();
      } catch (error) {
        await deleteFromCloudinary(result.public_id);
        throw error;
      }

      // Delete the OLD image from Cloudinary
      if (oldPublicId) {
        await deleteFromCloudinary(oldPublicId);
      }
    }

    return NextResponse.json(
      {
        message: "Post updated successfully",
        post,
      },
      {
        status: 200,
      },
    );
  } catch (error) {
    console.log(error);
    return handleError(error);
  }
}

// Delete a post
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

    const userId = payload.id;
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        {
          message: "Invalid post ID",
        },
        {
          status: 400,
        },
      );
    }
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

    if (post.author.toString() !== userId) {
      return NextResponse.json(
        {
          message: "Unauthorized to delete this post",
        },
        {
          status: 403,
        },
      );
    }

    await post.deleteOne();

    if (post.imagePublicId) {
      await deleteFromCloudinary(post.imagePublicId);
    }

    return NextResponse.json(
      {
        message: "Post deleted successfully",
      },
      {
        status: 200,
      },
    );
  } catch (error) {
    console.log(error);
    return handleError(error);
  }
}
