"use client";

type CampaignGeneratedImageProps = {
  image: string;
};

export default function CampaignGeneratedImage({
  image,
}: CampaignGeneratedImageProps) {
  return (
    <div className="flex justify-center">
      <img
        src={image}
        alt="Generated event DP"
        className="max-h-[700px] w-auto max-w-full rounded-xl shadow-lg"
      />
    </div>
  );
}