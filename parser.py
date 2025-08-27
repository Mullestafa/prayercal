import os
import base64
from io import BytesIO
import json

from fastapi import HTTPException
from mistralai import Mistral, ImageURLChunk
from mistralai.extra import response_format_from_pydantic_model
from PIL import Image

from models import MonthlyPrayerSchedule

class PrayerTimesParser:
    def __init__(self):
        api_key = os.getenv("MISTRAL_API_KEY")
        if not api_key:
            print("Warning: MISTRAL_API_KEY not set. Parser will not work without valid API key.")
            self.client = None
        else:
            self.client = Mistral(api_key=api_key)
        
    def encode_image_to_base64(self, image_bytes: bytes) -> str:
        """Convert image bytes to base64 string."""
        return base64.b64encode(image_bytes).decode('utf-8')
    
    async def parse_prayer_timetable(self, image_bytes: bytes) -> MonthlyPrayerSchedule:
        """Parse prayer timetable from image using Mistral OCR."""
        if not self.client:
            raise HTTPException(
                status_code=500,
                detail="Mistral API client not configured. Please set MISTRAL_API_KEY environment variable."
            )
            
        try:
            # Validate image
            Image.open(BytesIO(image_bytes))
            
            # Convert image to base64 for OCR
            base64_image = self.encode_image_to_base64(image_bytes)
            
            # Create image URL chunk for OCR
            image_chunk = ImageURLChunk(
                image_url=f"data:image/jpeg;base64,{base64_image}"
            )
            
            # # Use OCR to extract text and then parse with structured format
            # try:
            #     response = self.client.ocr.process(
            #         model="mistral-ocr-latest",
            #         document=image_chunk,
            #         bbox_annotation_format=response_format_from_pydantic_model(MonthlyPrayerSchedule),
            #         include_image_base64=False
            #     )
                
            #     # Try to extract structured data if available
            #     if hasattr(response, 'structured_data') and response.structured_data:
            #         return MonthlyPrayerSchedule(**response.structured_data)
                    
            # except Exception as ocr_error:
            #     print(f"OCR structured parsing failed: {ocr_error}")
            #     # Fall back to basic OCR text extraction
                
            # Fall back to text extraction and manual parsing
            response = self.client.ocr.process(
                model="mistral-ocr-latest",
                document=image_chunk,
                include_image_base64=False
            )
            
            # Get extracted text
            extracted_text = ""
            if hasattr(response, 'pages'):
                extracted_text = "\n".join(page.markdown for page in response.pages)
            
            # Try using Mistral Small to parse the extracted text
            try:
                return await self._parse_with_mistral_chat(extracted_text)
            except Exception as chat_error:
                print(f"Mistral chat parsing failed: {chat_error}")
                raise chat_error
            
        except json.JSONDecodeError as e:
            raise HTTPException(
                status_code=422, 
                detail=f"Failed to parse OCR response as JSON: {str(e)}"
            )
        except Exception as e:
            raise HTTPException(
                status_code=500, 
                detail=f"Error parsing prayer timetable with OCR: {str(e)}"
            )
    
    async def _parse_with_mistral_chat(self, extracted_text: str) -> MonthlyPrayerSchedule:
        """Parse extracted OCR text using Mistral chat completion."""
        
        # Get the JSON schema from the Pydantic model
        schema = MonthlyPrayerSchedule.model_json_schema()
        
        # Create a prompt for parsing the prayer schedule
        system_prompt = f"""You are an expert at parsing Islamic prayer timetables. Given OCR-extracted text from a prayer timetable image, extract and structure the prayer times information.

The output should be a JSON object that conforms to this exact schema:
{json.dumps(schema, indent=2)}

Extract all available days from the timetable.

For time fields, use HH:MM format (24-hour format)."""

        user_prompt = f"Parse this prayer timetable text and return only the JSON structure:\n\n{extracted_text}"
        
        try:
            response = self.client.chat.complete(
                model="mistral-small-latest",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                response_format={"type": "json_object"}
            )
            
            # Parse the JSON response
            content = response.choices[0].message.content
            parsed_data = json.loads(content)
            
            # Convert the parsed data to our Pydantic model
            return MonthlyPrayerSchedule(**parsed_data)
            
        except Exception as e:
            print(f"Error in Mistral chat parsing: {e}")
            raise e
