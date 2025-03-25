import { PopulatedEvents } from "@/types/Event";

interface EventCardProps {
  event: PopulatedEvents;
  setActiveTab: React.Dispatch<React.SetStateAction<string>>;
  setIsHostEventEditing: React.Dispatch<React.SetStateAction<boolean>>;
}

export function EventCard({ event, setIsHostEventEditing }: EventCardProps) {
  console.log(event, setIsHostEventEditing)
  return <></>;
}
